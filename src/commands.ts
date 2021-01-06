
/* IMPORT */

const fs = require('fs');
const path = require('path');
import * as vscode from 'vscode';
import * as uuid from 'uuid';
import * as UrlPattern from 'url-pattern';
import * as rp from 'request-promise';
import Utils from './utils';
import { parse } from 'fast-csv';

let context = null;

const TodoistTaskUrl = new UrlPattern('https\\://todoist.com/showTask?id=:id');

const TodoistTokenKey = 'coffeebreak.todoist.token';

async function updateToken () {

  const token = await vscode.window.showInputBox ({ placeHolder: 'Please, insert Todoist API token ...' });
  Utils.setContextValue(TodoistTokenKey, token);
  return token;

}

async function getToken () {

  let token = Utils.getContextValue(TodoistTokenKey);

  if (!token) {
    token = await vscode.commands.executeCommand('coffeebreak.todoist.updateToken');
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

  return Promise.all(tasks.map(syncTask));

  async function syncTask (task) {
    // TODO: Move this to Coffee Break itself
    task.backlinkURL = `vscode://file/${encodeURIComponent(task.filePath)}:${task.lineNr+1}`;

    const { command, ...taskOptions } = task.sync;
    let args = Object.assign({}, options, taskOptions, {
      content: `${task.text.trim()} ${task.backlinkURL} ((☰))`,
      due_date: task.dueDate,
      auto_parse_labels: false
    }, TodoistTaskUrl.match(task.externalURL));

    if (args.id) {
      // Update the task by id and return the original object unchanged
      args.id = parseInt(args.id);
      return post(`https://api.todoist.com/rest/v1/tasks/${args.id}`, args)
        .then(() => task);
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

  const labels = await rp(options) || [];

  const content = JSON.stringify(labels, null, 2);
  vscode.workspace.openTextDocument({ content, language: 'json' })
    .then((doc: vscode.TextDocument) => vscode.window.showTextDocument(doc, 1, false));
}

async function convertTodoistCSV () {
  const options = {
    filters: {
      'CSV files': [ 'csv' ]
    },
    title: 'Select Todoist export file'
  };
  
  const archiveUri:vscode.Uri[] = await vscode.window.showOpenDialog(options);
  if (!archiveUri || !archiveUri.length) {
    console.warn('No file selected');
    return;
  }

  try {
    var indents = '';
    var content = [];

    fs.createReadStream(archiveUri[0].fsPath)
      .pipe(parse({ headers: false }))
      .on('data', row => {
        if (row['0'] === 'task') {
          indents = '\t\t\t\t'.substr(0, row[3] - 1);
          content.push(`${indents}- [ ] ${row[1]}`.replace('[ ] *', ''));
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
          openNewMarkdownDocument(`# ${path.basename(archiveUri[0].fsPath, '.csv')}\n\n${content.join('\n')}`);
        }
      });
  }
  catch (e) {
    console.error(e);
  }
}

function openNewMarkdownDocument (content) {
  vscode.workspace.openTextDocument({ content, language: 'markdown' })
    .then((doc: vscode.TextDocument) => vscode.window.showTextDocument(doc, 1, false));
}

export { context, updateToken, sync, getLabels, convertTodoistCSV};
