import * as vscode from 'vscode';
import { HTMLensPanel } from './previewPanel';

export function activate(context: vscode.ExtensionContext) {
  const open = (side: boolean) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('HTMLens: open an HTML/template/React file first.');
      return;
    }
    HTMLensPanel.createOrShow(context.extensionUri, editor.document, side);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('htmlens.open', () => open(false)),
    vscode.commands.registerCommand('htmlens.openToSide', () => open(true)),
    vscode.commands.registerCommand('htmlens.refresh', () => HTMLensPanel.current?.refresh()),
    vscode.commands.registerCommand('htmlens.toggleElseBranch', () => HTMLensPanel.current?.toggleElseBranch())
  );

  // Live update: re-render on every edit (debounced) to the file currently being previewed.
  let debounceTimer: NodeJS.Timeout | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!HTMLensPanel.current || !HTMLensPanel.current.isPreviewing(e.document.uri)) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        HTMLensPanel.current?.update(e.document);
      }, 250);
    })
  );

  // Also catch saves to files that were {% include %}'d or {% extends %}'d by the previewed doc.
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      HTMLensPanel.current?.refresh();
    })
  );
}

export function deactivate() {
  // no-op; VS Code disposes registered subscriptions automatically
}
