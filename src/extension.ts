import * as vscode from 'vscode';
import { cleanupComponents } from './cleanupComponents';
import { cleanupProps } from './cleanupProps';

export function activate(context: vscode.ExtensionContext) {
  let components = vscode.commands.registerCommand(
    'reiz-vue-utils.cleanup-components',
    cleanupComponents
  );

  let props = vscode.commands.registerCommand(
    'reiz-vue-utils.convert-to-typescript',
    cleanupProps
  );

  context.subscriptions.push(components);
  context.subscriptions.push(props);
}

export function deactivate() {}
