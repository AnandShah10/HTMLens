/**
 * Builds a standalone HTML document that transpiles a single React component
 * file in-browser (Babel standalone) and renders it. This is a preview tool,
 * not a bundler: local imports (./Foo, ../utils) are stripped with a visible
 * warning since there's no module resolution in a plain webview. Imports from
 * "react" / "react-dom" are safe to strip since we inject them globally.
 */
export function buildReactPreviewHtml(
  componentSource: string,
  cspSource: string,
  nonce: string
): { html: string; strippedImports: string[] } {
  const strippedImports: string[] = [];

  const cleaned = componentSource.replace(
    /^import\s+.*?from\s+['"](.+?)['"];?\s*$/gm,
    (full, spec: string) => {
      if (spec === 'react' || spec === 'react-dom' || spec === 'react-dom/client') {
        return ''; // provided as globals below
      }
      strippedImports.push(spec);
      return `// stripped: ${full.trim()}`;
    }
  );

  // Try to detect the default export's identifier name so we know what to render.
  let componentName = 'App';
  const defaultExportMatch =
    cleaned.match(/export\s+default\s+function\s+([A-Za-z0-9_$]+)/) ||
    cleaned.match(/export\s+default\s+class\s+([A-Za-z0-9_$]+)/) ||
    cleaned.match(/export\s+default\s+([A-Za-z0-9_$]+)\s*;?\s*$/m);
  if (defaultExportMatch) componentName = defaultExportMatch[1];

  // Strip the export keywords - Babel standalone with 'script' type doesn't need modules.
  const withoutExports = cleaned
    .replace(/export\s+default\s+function/, 'function')
    .replace(/export\s+default\s+class/, 'class')
    .replace(/export\s+default\s+([A-Za-z0-9_$]+)\s*;?/, '')
    .replace(/export\s+(const|function|class)/g, '$1');

  const warningBanner = strippedImports.length
    ? `<div class="he-react-warning">⚠ Local/module imports stripped (no bundler in preview): ${strippedImports
        .map((s) => escapeHtml(s))
        .join(', ')}. Component may not render if it depends on them.</div>`
    : '';

  return {
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' https://unpkg.com; style-src 'unsafe-inline' ${cspSource}; img-src ${cspSource} https: data:; font-src ${cspSource} https:;">
<style>
  body { font-family: -apple-system, Segoe UI, sans-serif; margin: 0; padding: 16px; }
  .he-react-warning { background:#fff3cd; color:#664d03; border:1px solid #ffe69c; padding:8px 12px; border-radius:6px; margin-bottom:12px; font-size:13px; }
  #he-root { border: 1px dashed #ccc; padding: 16px; border-radius: 8px; }
  #he-error { color: #b00020; white-space: pre-wrap; font-family: monospace; padding: 12px; background: #fff0f0; border-radius: 6px; }
</style>
</head>
<body>
${warningBanner}
<div id="he-root"></div>
<div id="he-error"></div>
<script nonce="${nonce}" src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script nonce="${nonce}" src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script nonce="${nonce}" src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script nonce="${nonce}" type="text/babel" data-presets="react">
const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = React;
try {
  ${withoutExports}
  const root = ReactDOM.createRoot(document.getElementById('he-root'));
  const Comp = typeof ${componentName} !== 'undefined' ? ${componentName} : null;
  if (Comp) {
    root.render(React.createElement(Comp));
  } else {
    document.getElementById('he-error').textContent =
      'HTMLens could not find a default-exported component named "${componentName}" to render.';
  }
} catch (err) {
  document.getElementById('he-error').textContent = 'Render error: ' + err.message;
}
</script>
</body>
</html>`,
    strippedImports,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
