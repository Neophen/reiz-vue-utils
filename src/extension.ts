// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { cleanupComponents } from './cleanupComponents';
import { cleanupProps } from './cleanupProps';

export function activate(context: vscode.ExtensionContext) {
  let components = vscode.commands.registerCommand(
    'remove-auto-components.cleanup-components',
    cleanupComponents
  );

  let props = vscode.commands.registerCommand(
    'remove-auto-components.convert-to-typescript',
    cleanupProps
  );

  context.subscriptions.push(components);
  context.subscriptions.push(props);
}

// This method is called when your extension is deactivated
export function deactivate() {}
