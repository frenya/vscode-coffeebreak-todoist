
/* IMPORT */

const fs = require('fs');
const path = require('path');
import * as vscode from 'vscode';
import * as uuid from 'uuid';
import * as UrlPattern from 'url-pattern';
import * as rp from 'request-promise';
import * as moment from 'moment';
import Utils from './utils';
import { parse } from 'fast-csv';

let context = null;

const TodoistTaskUrl = new UrlPattern('https\\://todoist.com/showTask?id=:id');

const TodoistTokenKey = 'coffeebreak.todoist.token';

async function updateToken () {

  const token = await vscode.window.showInputBox ({ 
    placeHolder: 'Please, insert Todoist API token ...',
    prompt: 'It can be found in Todoist under Settings -> Integration -> API token',
    ignoreFocusOut: true,
  });
  if (token) Utils.setGlobalContextValue(TodoistTokenKey, token);
  return token;

}

async function getToken () {

  let token = Utils.getGlobalContextValue(TodoistTokenKey);

  if (!token) {
    // Migrate workspace context value (legacy) to global context
    token = Utils.getContextValue(TodoistTokenKey);
    if (token) {
      console.log('Migrating token to global context');
      Utils.setGlobalContextValue(TodoistTokenKey, token);
    }
    else token = await vscode.commands.executeCommand('coffeebreak.todoist.updateToken');
  }

  return token;

}

/**
 * Push a list of tasks into Todoist
 * 
 * @param tasks Array of task objects to synchronize to Todoist
 * @param uri URI of the file that is being synchronized, used to pull local sync config
 * @returns An array of newly created tasks with their id's filled
 */
async function sync (tasks: any[], uri: vscode.Uri, options: object = {}) {

  // Sanity check - this command should be called by CoffeeBreak extension with appropriate arguments
  // missing arguments probably mean that the user has call the command directly
  if (!tasks || !uri) {
    vscode.window.showWarningMessage('Arguments are missing. Please, call the "Coffee Break: Synchronize file with external task manager" command!"');
    return;
  }

  // Make sure we have an authentication token
  const token = await getToken();
  if (!token) throw new Error('No Todoist token available');
  // else console.log(token);

  const primaryFilePath = uri.fsPath;

  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Synchronizing with Todoist ...",
    cancellable: false
  }, (progress, token) => {
    return Promise.all(tasks.map(syncTask));
  });

  async function syncTask (task) {
    // TODO: Move this to Coffee Break itself
    // task.backlinkURL = `vscode://file/${encodeURIComponent(task.filePath)}:${task.lineNr+1}`;

    const { command, ...taskOptions } = task.sync;
    let args = Object.assign({}, options, taskOptions, {
      content: `${task.text.trim()} ${task.backlinkURL} ((☰))`,
      due_date: task.dueDate,
      auto_parse_labels: false
    }, TodoistTaskUrl.match(task.externalURL));

    if (args.id) {
      // Update the task by id and return the original object unchanged
      args.id = parseInt(args.id);
      if (task.filePath === primaryFilePath) {
        console.log('Updating task', args);
        await post(`https://api.todoist.com/rest/v1/tasks/${args.id}`, args);
      }
      return getCompletionStatus(args.id)
        .then((result) => ({ completed: result.item.checked, ...task }));
    }
    else {
      // Create the task and set the externalURL attribute before returning it
      return post('https://api.todoist.com/rest/v1/tasks', args)
        .then((result) => ({ externalURL: TodoistTaskUrl.stringify({ id: result.id }), ...task }));
    }
  }

  async function post (endpoint, data) {
    return rp({
      method: 'POST',
      uri: endpoint,
      body: data,
      headers: requestHeader(token),
      json: true,
    });
  }

  async function getCompletionStatus (id) {
    // curl  -d "token=$token" -d "item_id=4643171520" -d "all_data=false"
    return rp({
      method: 'GET',
      uri: "https://api.todoist.com/sync/v8/items/get",
      qs: {
        token: token,
        item_id: id,
        all_data: false,
      },
      // headers: requestHeader(token),
      json: true,
    })
    .catch(console.error);
  }

}

function requestHeader (token) {
  return {
    'User-Agent': 'Request-Promise',
    'Authorization': `Bearer ${token}`,
    'X-Request-Id': uuid(),
  };
}

/**
 * Show a list of Todoist labels in a new text editor.
 */
async function getLabels () {
  const labels = await getLabelsFromTodoist();

  const content = JSON.stringify(labels, null, 2);
  vscode.workspace.openTextDocument({ content, language: 'json' })
    .then((doc: vscode.TextDocument) => vscode.window.showTextDocument(doc, 1, false));
}

async function convertTodoistCSV () {
  const options = {
    filters: {
      'CSV files': [ 'csv' ]
    },
    title: 'Select Todoist export file',
    canSelectMany: true,
  };
  
  const archiveUri:vscode.Uri[] = await vscode.window.showOpenDialog(options);
  if (!archiveUri || !archiveUri.length) {
    console.warn('No file selected');
    return;
  }

  archiveUri.forEach((uri) => {
    try {
      var indents = '';
      var content = [];
  
      fs.createReadStream(uri.fsPath)
        .pipe(parse({ headers: false }))
        .on('data', row => {
          if (row['0'] === 'task') {
            indents = '\t\t\t\t'.substr(0, row[3] - 1);
            let dueDateTag = row[6] ? ` @due(${parseDueDate(row[6])})` : '';
            let priorityTag = row[2] != 4 ? ` @priority(${row[2]})` : '';  // tslint:disable-line:triple-equals
            content.push(`${indents}- [ ] ${row[1]}${priorityTag}${dueDateTag}`.replace('[ ] *', ''));
          }
          else if (row['0'] === 'note') {
            const prefix = `\n${indents}\t> `;
            content.push(`${prefix}${row[1].replace(/\[\[file.*\]\]/, '').replace(/\n/g, prefix)}\n`);
          }
          else if (row['0'] === 'section') {
            content.push(`\n# ${row[1]}\n`);
          }
        })
        .on('error', console.error)
        .on('end', () => {
          if (content.length) {
            openNewMarkdownDocument(`# ${path.basename(uri.fsPath, '.csv')}\n\n${content.join('\n')}`);
          }
        });
    }
    catch (e) {
      console.error(e);
    }
  });
}

function parseDueDate (dateStr) {
  // This parse format seems to work with Todoist exports best
  // NOTE: The export must be done without relative dates
  let dueDate = moment(dateStr, 'DD MMM YYYY');
  return dueDate.isValid() ? dueDate.format('YYYY-MM-DD') : dateStr;
}

function openNewMarkdownDocument (content) {
  vscode.workspace.openTextDocument({ content, language: 'markdown' })
    .then((doc: vscode.TextDocument) => vscode.window.showTextDocument(doc, 1, false));
}

async function syncSetup () {
  let result = {};

  const projects = await getProjectsFromTodoist();
  const projectItems = projects.map((p) => {
    return {
      label: p.name,
      project_id: p.id,
    };
  });

  const project = await vscode.window.showQuickPick(projectItems, { placeHolder: 'Select target project in Todoist', ignoreFocusOut: true });
  if (project) result['project_id'] = project['project_id'];

  const labels = await getLabelsFromTodoist();
  const labelItems = labels.map((p) => {
    return {
      label: p.name,
      label_id: p.id,
    };
  });

  const selectedLabels = await vscode.window.showQuickPick(labelItems, { placeHolder: 'Optional: Select Todoist labels to add to tasks when synchronizing', canPickMany: true });
  if (selectedLabels) result['label_ids'] = selectedLabels.map(label => label['label_id']);

  console.log(result);

  return result;
}

export { context, updateToken, sync, getLabels, convertTodoistCSV, syncSetup };

async function getLabelsFromTodoist () {
  // Make sure we have an authentication token
  const token = await getToken();
  if (!token) {
    throw new Error('No Todoist token available');
  }

  const options = {
    method: "GET",
    uri: 'https://api.todoist.com/rest/v1/labels',
    headers: requestHeader(token),
    json: true
  };

  return await rp(options) || [];
}

async function getProjectsFromTodoist () {
  // Make sure we have an authentication token
  const token = await getToken();
  if (!token) {
    throw new Error('No Todoist token available');
  }

  const options = {
    method: "GET",
    uri: 'https://api.todoist.com/rest/v1/projects',
    headers: requestHeader(token),
    json: true
  };

  return await rp(options) || [];
}

