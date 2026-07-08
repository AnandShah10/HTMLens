import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { processTemplate, ProcessOptions } from './templateProcessor';
import { buildReactPreviewHtml } from './reactRenderer';

const REACT_EXTS = new Set(['.jsx', '.tsx']);
const TEMPLATE_EXTS = new Set(['.html', '.htm', '.django', '.jinja', '.jinja2', '.j2', '.njk']);

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

export class HTMLensPanel {
  public static current: HTMLensPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private currentDocUri: vscode.Uri | undefined;
  private showElseBranch = false;

  public static createOrShow(extensionUri: vscode.Uri, doc: vscode.TextDocument, side: boolean) {
    const column = side ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
    if (HTMLensPanel.current) {
      HTMLensPanel.current.panel.reveal(column);
      HTMLensPanel.current.update(doc);
      return;
    }
    const panel = vscode.window.createWebviewPanel('htmlens', 'HTMLens', column, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [extensionUri, ...(vscode.workspace.workspaceFolders?.map((f) => f.uri) ?? [])],
    });
    HTMLensPanel.current = new HTMLensPanel(panel, extensionUri);
    HTMLensPanel.current.update(doc);
  }

  private constructor(panel: vscode.WebviewPanel, private readonly extensionUri: vscode.Uri) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'openExternal' && this.currentDocUri) {
        vscode.env.openExternal(this.currentDocUri);
      }
    });
  }

  public toggleElseBranch() {
    this.showElseBranch = !this.showElseBranch;
    if (this.currentDocUri) {
      vscode.workspace.openTextDocument(this.currentDocUri).then((doc) => this.update(doc));
    }
  }

  public refresh() {
    if (this.currentDocUri) {
      vscode.workspace.openTextDocument(this.currentDocUri).then((doc) => this.update(doc));
    }
  }

  public isPreviewing(uri: vscode.Uri): boolean {
    return this.currentDocUri?.toString() === uri.toString();
  }

  public update(doc: vscode.TextDocument) {
    this.currentDocUri = doc.uri;
    const ext = path.extname(doc.fileName).toLowerCase();
    this.panel.title = `HTMLens: ${path.basename(doc.fileName)}`;

    try {
      if (REACT_EXTS.has(ext)) {
        this.panel.webview.html = this.renderReact(doc);
      } else if (TEMPLATE_EXTS.has(ext)) {
        this.panel.webview.html = this.renderTemplate(doc);
      } else {
        this.panel.webview.html = this.wrapMessage(
          `HTMLens doesn't recognize "${ext}" yet. Supported: .html, .htm, .django, .jinja, .jinja2, .j2, .njk, .jsx, .tsx`
        );
      }
    } catch (err: any) {
      this.panel.webview.html = this.wrapMessage(`HTMLens error: ${err.message}`);
    }
  }

  private renderReact(doc: vscode.TextDocument): string {
    const nonce = getNonce();
    const { html } = buildReactPreviewHtml(doc.getText(), this.panel.webview.cspSource, nonce);
    return html;
  }

  private renderTemplate(doc: vscode.TextDocument): string {
    const config = vscode.workspace.getConfiguration('htmlens');
    const opts: ProcessOptions = {
      showElseBranch: this.showElseBranch,
      mockStyle: config.get('mockVariableStyle', 'highlight') as 'highlight' | 'value',
      maxIncludeDepth: config.get('includeMaxDepth', 5),
    };
    const searchRoots = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
    const result = processTemplate(doc.getText(), doc.uri.fsPath, searchRoots, opts);

    const rewritten = this.rewriteAssetPaths(result.html, doc.uri);
    const nonce = getNonce();
    const cspSource = this.panel.webview.cspSource;

    const warningsHtml = result.warnings.length
      ? `<div class="he-banner he-warn">${result.warnings.map((w) => `⚠ ${escapeHtml(w)}`).join('<br>')}</div>`
      : '';
    const varsHtml = result.variables.length
      ? `<div class="he-banner he-info">Detected variables (${result.engine}): ${result.variables
          .map((v) => `<code>${escapeHtml(v)}</code>`)
          .join(', ')}</div>`
      : '';

    // If the doc already has <html>, inject banners right after <body>; otherwise wrap fully.
    const hasHtmlShell = /<html[\s>]/i.test(rewritten);
    const styleTag = `<style nonce="${nonce}">
      .he-banner { font-family: -apple-system, Segoe UI, sans-serif; font-size: 12px; padding: 6px 10px; }
      .he-warn { background:#fff3cd; color:#664d03; }
      .he-info { background:#e7f1ff; color:#084298; }
      .he-var { background:#fff3cd; border:1px solid #ffe69c; border-radius:3px; padding:0 3px; font-family:monospace; font-size:0.9em; }
      .he-loop { border-left:3px solid #6f42c1; padding-left:10px; margin:6px 0; }
      .he-loop-badge, .he-cond-badge { font-size:11px; color:#6f42c1; font-family:monospace; margin-bottom:4px; }
      .he-cond { border-left:3px solid #0d6efd; padding-left:10px; margin:6px 0; }
      .he-cond-badge { color:#0d6efd; }
    </style>`;

    if (hasHtmlShell) {
      return rewritten.replace(/<head[^>]*>/i, (m) => `${m}${styleTag}`).replace(
        /<body[^>]*>/i,
        (m) => `${m}${warningsHtml}${varsHtml}`
      );
    }

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; style-src 'unsafe-inline' ${cspSource}; script-src 'nonce-${nonce}' ${cspSource};">
${styleTag}
</head><body>${warningsHtml}${varsHtml}${rewritten}</body></html>`;
  }

  /** Rewrite relative href/src to webview URIs so local CSS/JS/images actually load. */
  private rewriteAssetPaths(html: string, docUri: vscode.Uri): string {
    const baseDir = path.dirname(docUri.fsPath);
    return html.replace(/(href|src)=["']([^"']+)["']/g, (full, attr: string, ref: string) => {
      if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:') || ref.startsWith('#')) return full;
      const abs = path.resolve(baseDir, ref);
      if (!fs.existsSync(abs)) return full; // leave as-is (e.g. Django {% static %} that wasn't resolved)
      const webviewUri = this.panel.webview.asWebviewUri(vscode.Uri.file(abs));
      return `${attr}="${webviewUri}"`;
    });
  }

  private wrapMessage(msg: string): string {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;color:#666;">${escapeHtml(
      msg
    )}</body></html>`;
  }

  public dispose() {
    HTMLensPanel.current = undefined;
    this.panel.dispose();
    while (this.disposables.length) this.disposables.pop()?.dispose();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
