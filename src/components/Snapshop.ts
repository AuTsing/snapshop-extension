import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export enum WebviewMessageCommand {
    getState = 'getState',
    setState = 'setState',
}

export interface IWebviewMessage {
    command: WebviewMessageCommand;
    data: any;
}

export default class Snapshop {
    private context: vscode.ExtensionContext;
    private panel?: vscode.WebviewPanel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private loadWebview(): string {
        const root = this.context.extensionPath;
        const assets = path.join(root, 'dist', 'snapshop', 'assets');

        const html = path.join(root, 'dist', 'snapshop', 'index.html');
        const htmlContent = fs.readFileSync(html, { encoding: 'utf8' });
        const replacer = (_: string, filename: string) => {
            const js = path.join(assets, filename);
            const uri = vscode.Uri.file(js).with({ scheme: 'vscode-resource' });
            return `${uri}`;
        };
        const htmlContentReplaced = htmlContent.replace(/\/assets\/(index\.\S*\.js)/, replacer).replace(/\/assets\/(style\.\S*\.css)/, replacer);

        return htmlContentReplaced;
    }

    public open(): void {
        if (this.panel) {
            this.panel.reveal(vscode.window.activeTextEditor?.viewColumn);
            return;
        }

        this.panel = vscode.window.createWebviewPanel('snapshop', 'Snapshop', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.webview.onDidReceiveMessage((message: IWebviewMessage) => {
            if (!this.panel) {
                return;
            }
            switch (message.command) {
                case WebviewMessageCommand.getState:
                    return this.handleGetState(this.panel);
                case WebviewMessageCommand.setState:
                    return this.handleSetState(message.data);
                default:
                    break;
            }
        });
        this.panel.webview.html = this.loadWebview();
        this.panel.iconPath = vscode.Uri.file(path.join(this.context.extensionPath, 'assets', 'logo_48_48.png'));
        this.panel.onDidDispose(() => (this.panel = undefined));
    }

    private handleGetState(panel: vscode.WebviewPanel) {
        const message: IWebviewMessage = {
            command: WebviewMessageCommand.getState,
            data: this.context.globalState.get('snapshop') ?? {},
        };
        panel.webview.postMessage(message);
    }

    private handleSetState(data: any) {
        this.context.globalState.update('snapshop', data);
    }
}
