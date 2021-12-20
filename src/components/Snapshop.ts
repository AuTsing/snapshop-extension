import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
        this.panel = vscode.window.createWebviewPanel('Snapshop', 'SNAPSHOP', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.webview.html = this.loadWebview();
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }
}
