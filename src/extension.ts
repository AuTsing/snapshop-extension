import * as vscode from 'vscode';
import Snapshop from './components/Snapshop';

export function activate(context: vscode.ExtensionContext) {
    const snapshop = new Snapshop(context);
    context.subscriptions.push(vscode.commands.registerCommand('snapshop-extension.snapshop', () => snapshop.open()));
}

export function deactivate() {}
