import { ExtensionContext, WebviewPanel, Uri, window, ViewColumn } from 'vscode';
import { join } from 'path';
import { readFileSync } from 'fs';

enum WebviewMessageCommand {
    GetItem = 'GetItem',
    SetItem = 'SetItem',
}

interface WebviewMessage {
    command: WebviewMessageCommand;
    data: { key: string; value?: string };
}

export default class Snapshop {
    private readonly context: ExtensionContext;
    private panel: WebviewPanel | null;

    constructor(context: ExtensionContext) {
        this.context = context;
        this.panel = null;
    }

    private loadWebview(panel: WebviewPanel): string {
        const rootPath = this.context.extensionPath;
        const assetsDir = join(rootPath, 'dist', 'snapshop', 'assets');

        const htmlPath = join(rootPath, 'dist', 'snapshop', 'index.html');
        const htmlContent = readFileSync(htmlPath, { encoding: 'utf8' });
        const replacer = (_: string, filename: string) => {
            const path = join(assetsDir, filename);
            const uri = Uri.file(path);
            const src = panel.webview.asWebviewUri(uri);
            return src.toString();
        };
        const htmlContentReplaced = htmlContent
            .replace(/\/assets\/(index-\S*\.js)/, replacer)
            .replace(/\/assets\/(index-\S*\.css)/, replacer);

        return htmlContentReplaced;
    }

    private async handleGetItem(panel: WebviewPanel, message: WebviewMessage) {
        try {
            const state = this.context.globalState.get<{ [key: string]: any }>('snapshop') ?? {};
            const newMessage: WebviewMessage = {
                command: WebviewMessageCommand.GetItem,
                data: { key: message.data.key, value: state[message.data.key] },
            };
            await panel.webview.postMessage(newMessage);
        } catch (e) {
            console.error(e);
        }
    }

    private async handleSetItem(message: WebviewMessage) {
        try {
            const state = this.context.globalState.get<{ [key: string]: any }>('snapshop') ?? {};
            state[message.data.key] = message.data.value;
            await this.context.globalState.update('snapshop', state);
        } catch (e) {
            console.error(e);
        }
    }

    open() {
        if (this.panel !== null) {
            this.panel.reveal(window.activeTextEditor?.viewColumn);
            return;
        }

        this.panel = window.createWebviewPanel('snapshop', 'Snapshop', ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
            if (this.panel === null) {
                return;
            }
            switch (message.command) {
                case WebviewMessageCommand.GetItem:
                    this.handleGetItem(this.panel, message);
                    break;
                case WebviewMessageCommand.SetItem:
                    this.handleSetItem(message);
                    break;
            }
        });
        this.panel.webview.html = this.loadWebview(this.panel);
        this.panel.iconPath = Uri.file(join(this.context.extensionPath, 'assets', 'logo_48_48.png'));
        this.panel.onDidDispose(() => (this.panel = null), null, this.context.subscriptions);
    }
}
