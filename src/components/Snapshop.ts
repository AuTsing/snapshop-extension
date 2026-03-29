import { ExtensionContext, WebviewPanel, Uri, window, ViewColumn } from 'vscode';
import { join } from 'path';
import { readFileSync } from 'fs';

export enum WebviewMessageCommand {
    getItem = 'getItem',
    setItem = 'setItem',
}

export interface IWebviewMessage {
    command: WebviewMessageCommand;
    data: any;
}

export default class Snapshop {
    private context: ExtensionContext;
    private panel?: WebviewPanel;

    constructor(context: ExtensionContext) {
        this.context = context;
    }

    private loadWebview(panel: WebviewPanel): string {
        const root = this.context.extensionPath;
        const assets = join(root, 'dist', 'snapshop', 'assets');

        const html = join(root, 'dist', 'snapshop', 'index.html');
        const htmlContent = readFileSync(html, { encoding: 'utf8' });
        const replacer = (_: string, filename: string) => {
            const path = join(assets, filename);
            const uri = Uri.file(path);
            const src = panel.webview.asWebviewUri(uri);
            return src.toString();
        };
        const htmlContentReplaced = htmlContent
            .replace(/\/assets\/(index-\S*\.js)/, replacer)
            .replace(/\/assets\/(index-\S*\.css)/, replacer);

        return htmlContentReplaced;
    }

    public open(): void {
        if (this.panel) {
            this.panel.reveal(window.activeTextEditor?.viewColumn);
            return;
        }

        this.panel = window.createWebviewPanel('snapshop', 'Snapshop', ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.webview.onDidReceiveMessage((message: IWebviewMessage) => {
            if (!this.panel) {
                return;
            }
            switch (message.command) {
                case WebviewMessageCommand.getItem:
                    return this.handleGetItem(this.panel, message.data);
                case WebviewMessageCommand.setItem:
                    return this.handleSetItem(message.data);
                default:
                    break;
            }
        });
        this.panel.webview.html = this.loadWebview(this.panel);
        this.panel.iconPath = Uri.file(join(this.context.extensionPath, 'assets', 'logo_48_48.png'));
        this.panel.onDidDispose(() => (this.panel = undefined), null, this.context.subscriptions);
    }

    private handleGetItem(panel: WebviewPanel, data: { key: string }) {
        const state: any = this.context.globalState.get('snapshop') ?? {};
        const message: IWebviewMessage = {
            command: WebviewMessageCommand.getItem,
            data: { key: data.key, value: state[data.key] },
        };
        panel.webview.postMessage(message);
    }

    private handleSetItem(data: { key: string; value: any }) {
        const state: any = this.context.globalState.get('snapshop') ?? {};
        state[data.key] = data.value;
        this.context.globalState.update('snapshop', state);
    }
}
