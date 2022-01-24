import * as Vscode from 'vscode';
import * as Path from 'path';
import * as Fs from 'fs';

export enum WebviewMessageCommand {
    getState = 'getState',
    setState = 'setState',
}

export interface IWebviewMessage {
    command: WebviewMessageCommand;
    data: any;
}

export default class Snapshop {
    private context: Vscode.ExtensionContext;
    private panel?: Vscode.WebviewPanel;

    constructor(context: Vscode.ExtensionContext) {
        this.context = context;
    }

    private loadWebview(): string {
        const root = this.context.extensionPath;
        const assets = Path.join(root, 'dist', 'snapshop', 'assets');

        const html = Path.join(root, 'dist', 'snapshop', 'index.html');
        const htmlContent = Fs.readFileSync(html, { encoding: 'utf8' });
        const replacer = (_: string, filename: string) => {
            const js = Path.join(assets, filename);
            const uri = Vscode.Uri.file(js).with({ scheme: 'vscode-resource' });
            return `${uri}`;
        };
        const htmlContentReplaced = htmlContent.replace(/\/assets\/(index\.\S*\.js)/, replacer).replace(/\/assets\/(style\.\S*\.css)/, replacer);

        return htmlContentReplaced;
    }

    public open(): void {
        Vscode.commands.executeCommand('workbench.action.closePanel');

        if (this.panel) {
            this.panel.reveal(Vscode.window.activeTextEditor?.viewColumn);
            return;
        }

        this.panel = Vscode.window.createWebviewPanel('snapshop', 'Snapshop', Vscode.ViewColumn.One, {
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
        this.panel.iconPath = Vscode.Uri.file(Path.join(this.context.extensionPath, 'assets', 'logo_48_48.png'));
        this.panel.onDidChangeViewState(e => {
            if (e.webviewPanel.visible) {
                Vscode.commands.executeCommand('workbench.action.closePanel');
            } else {
                Vscode.commands.executeCommand('workbench.action.togglePanel');
            }
        });
        this.panel.onDidDispose(() => (this.panel = undefined));
    }

    private handleGetState(panel: Vscode.WebviewPanel) {
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
