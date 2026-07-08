# HTMLens — Universal Template & HTML Previewer

Live preview for **plain HTML**, **Django templates**, **Jinja2**, **Nunjucks**,
and **React/JSX (.jsx/.tsx)** components — directly inside VS Code.

## What it actually does

| File type | Behavior |
|---|---|
| `.html` / `.htm` | Standard live preview. Relative `<link>`, `<script src>`, `<img src>` paths are rewritten to load correctly inside the webview sandbox. |
| `.django`, `.jinja`, `.jinja2`, `.j2`, `.njk` | Mock-renders the template: `{{ var }}` is replaced with a highlighted placeholder (or a generated sample value, configurable), `{% if %}/{% else %}/{% endif %}` renders one branch (toggle with a command), `{% for %}` renders the loop body once with a "repeats for each item" badge, `{% extends %}` + `{% block %}` resolves the full inheritance chain by searching your workspace for the parent template, and `{% include %}` inlines the referenced file recursively (depth-limited to avoid cycles). |
| `.jsx` / `.tsx` | Transpiled in-browser with Babel standalone and rendered with React 18 (loaded from a CDN). This is a **preview**, not a bundler — local `import` statements (`./Button`, `../hooks/useThing`) are stripped and flagged in a warning banner, since there's no module resolution without a real build step. Self-contained components render fine. |

## Project layout

```
htmlens/
├── package.json
├── tsconfig.json
├── .vscodeignore
├── .vscode/
│   ├── launch.json
│   └── tasks.json
└── src/
    ├── extension.ts        # activation, command registration, live-refresh wiring
    ├── previewPanel.ts      # webview lifecycle, asset URI rewriting
    ├── templateProcessor.ts # Django/Jinja/Nunjucks mock-rendering engine
    └── reactRenderer.ts     # React/JSX in-browser transpile + render
```

## Setup

Requires Node.js 18+ and npm.

```bash
cd prismview
npm install
```

This pulls in `typescript`, `@types/vscode`, `@types/node`, and `@vscode/vsce`
(only dev dependencies — the extension itself has zero runtime npm dependencies;
React/Babel for the JSX preview are loaded from a CDN at preview-time, not bundled).

## Run it (development mode)

1. Open the `prismview` folder in Antigravity.
2. Press **F5** (or Run → Start Debugging). This compiles TypeScript in watch
   mode and launches a second "Extension Development Host" window with
   PrismView loaded.
3. In that new window, open any `.html`, `.django`, `.jinja2`, `.njk`, `.jsx`,
   or `.tsx` file.
4. Click the preview icon in the editor title bar (top-right of the tab), or
   run **HTMLens: Open Preview to the Side** from the command palette
   (`Ctrl+Shift+P` / `Cmd+Shift+P`).
5. Edit and save the file — the preview updates automatically (debounced,
   ~250ms after you stop typing).

Useful commands (command palette):
- `HTMLens: Open Preview`
- `HTMLens: Open Preview to the Side`
- `HTMLens: Toggle {% if %}/{% else %} Branch` — flips which branch of
  conditional blocks is mock-rendered, so you can eyeball both states.
- `HTMLens: Refresh Preview`

## Settings

In Antigravity settings (search "htmlens"):

- `htmlens.mockVariableStyle` — `"highlight"` (default, shows `{{ var.name }}`
  as a tagged placeholder) or `"value"` (guesses a plausible sample value based
  on the variable name, e.g. `user.email` → `Sample user.email`, `total_price`
  → `99.00`).
- `htmlens.includeMaxDepth` — recursion limit for `{% extends %}` /
  `{% include %}` resolution (default `5`).

## Building a standalone .vsix (to install without dev mode)

```bash
npm run compile
npm run package
```

This produces `htmlens-1.0.0.vsix` in the project root. Install it via:

- Antigravity: Extensions panel → `...` menu → **Install from VSIX...** → select the file.
- Or from the terminal: `antigravity --install-extension htmlens-1.0.0.vsix`
  (substitute your editor's CLI binary name if different — e.g. `code` for VS Code proper).

## Known limitations (by design, not bugs)

- The React preview is not a bundler. Multi-file component trees, CSS imports,
  and non-CDN npm packages won't resolve — this is a fast single-component
  sanity-check tool, not a dev server replacement.
- Django template tags/filters not explicitly handled (custom template tags,
  unusual filters) are left as a visible `<!-- HTMLens: unhandled tag -->`
  comment rather than silently disappearing, so you always know what wasn't
  interpreted.
- `{% extends %}`/`{% include %}` resolution searches your open workspace
  folder(s) for a matching filename/path; if your template loader has custom
  search paths configured outside the workspace, resolution may fail (you'll
  get a warning banner, not a silent blank page).
