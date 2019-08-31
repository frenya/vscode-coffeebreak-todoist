// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as Commands from './commands';
import Utils from './utils';

function initCommands (context: vscode.ExtensionContext) {
  const {commands} = vscode.extensions.getExtension('frenya.vscode-coffeebreak-todoist').packageJSON.contributes;

  commands.forEach(({ command }) => {
    const commandName = command.split('.').pop() as string;
    const handler = Commands[commandName];
    const disposable = vscode.commands.registerCommand(command, handler);

    if (!handler) console.warn('No handler found for command', command);

    context.subscriptions.push ( disposable );
  });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate (context: vscode.ExtensionContext) {

  // Store context for future reference
  Utils.context = context;

  // Initialize all commands
  initCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
