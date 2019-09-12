import * as assert from 'assert';
import * as sinon from 'sinon';
import { before, beforeEach, afterEach } from 'mocha';

import * as rp from 'request-promise';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

import * as Commands from '../../commands';
import Utils from '../../utils';

const task = {
  message: ' neotrimovaný úkol k zapracování  ',
  lineNr: 25,
  filePath: '/jméno souboru s mezerami a háčky.md',
  dueDate: '2019-12-31',
  externalURL: 'https://todoist.com/showTask?id=66778899',
  sync: {
    'command': 'coffeebreak.todoist.sync',
    'project_id': 123456
  }
};

suite('Todoist Sync', () => {
  let stub = null;

  beforeEach (() => {
    stub = sinon.stub(Utils, 'getContextValue');
    stub.withArgs('coffeebreak.todoist.token').returns('bazinga');
  });

  afterEach (() => {
    stub.restore();
  });

	test('should correctly create tasks', () => {
    const { externalURL, ...t } = task;

    return Commands.sync([ t ], vscode.Uri.parse('file:///usr/test'), { label_ids: [ 123, 456 ] })
      .then(result => {
        console.log(result);
        // TODO: Assert result

        sinon.assert.calledOnce(rp);
        sinon.assert.calledWithMatch(rp, {
          body: {
            auto_parse_labels: false,
            content: 'neotrimovaný úkol k zapracování vscode://file/%2Fjm%C3%A9no%20souboru%20s%20mezerami%20a%20h%C3%A1%C4%8Dky.md:26 ((☰))',
            due_date: '2019-12-31',
            project_id: 123456,
            label_ids: [ 123, 456 ],
          },
          headers: {
            Authorization: 'Bearer bazinga',
            'User-Agent': 'Request-Promise',
            // 'X-Request-Id': 'b7a11cdf-3c6c-4da3-b150-43eba1ec0e5b'
          },
          json: true,
          method: 'POST',
          uri: 'https://api.todoist.com/rest/v1/tasks',
        });
      });
  });
  
	test('should correctly update tasks', () => {
    return Commands.sync([ task ], vscode.Uri.parse('file:///usr/test'), { label_ids: [ 123, 456 ] })
      .then(result => {
        console.log(result);
        // TODO: Assert result

        sinon.assert.calledTwice(rp);
        sinon.assert.calledWithMatch(rp, {
          body: {
            auto_parse_labels: false,
            content: 'neotrimovaný úkol k zapracování vscode://file/%2Fjm%C3%A9no%20souboru%20s%20mezerami%20a%20h%C3%A1%C4%8Dky.md:26 ((☰))',
            due_date: '2019-12-31',
            id: 66778899,
            project_id: 123456,
            label_ids: [ 123, 456 ],
          },
          headers: {
            Authorization: 'Bearer bazinga',
            'User-Agent': 'Request-Promise',
            // 'X-Request-Id': 'b7a11cdf-3c6c-4da3-b150-43eba1ec0e5b'
          },
          json: true,
          method: 'POST',
          uri: 'https://api.todoist.com/rest/v1/tasks/66778899',
        });
      });
  });
  
});
