# Development Guide for HTMLens

This document provides in-depth information for developers working on or extending HTMLens.

## Project Architecture

```
htmlens/
├── package.json
├── tsconfig.json
├── .vscode/                  # Debug launch configs (launch.json, tasks.json)
├── examples/                 # Demo files for all 4 preview modes (HTML, Django, React, inheritance)
├── media/                    # Screenshots (SVGs), icon.png, and other assets
├── src/
│   ├── extension.ts          # VS Code activation, command registration, live update listeners
│   ├── previewPanel.ts       # WebviewPanel lifecycle, content routing (React vs Template), asset rewriting, CSP
│   ├── templateProcessor.ts  # Core mock-rendering logic for Django/Jinja/Nunjucks
│   └── reactRenderer.ts      # Standalone React preview using Babel standalone + React 18 from CDN
├── out/                      # Compiled JavaScript (generated on build)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── DEVELOPMENT.md
└── README.md
```

### Key Components

1. **extension.ts**
   - Registers commands: `htmlens.open`, `htmlens.openToSide`, `htmlens.refresh`, `htmlens.toggleElseBranch`
   - Sets up debounced `onDidChangeTextDocument` listener (~250ms) for live preview updates
   - Listens for saves to included/extended templates to trigger full refresh

2. **previewPanel.ts**
   - Manages a single `WebviewPanel` instance (singleton pattern)
   - Detects file type and routes to appropriate renderer
   - Handles CSP, nonce generation, and asset path rewriting for local CSS/JS/images
   - Injects warning/info banners for unresolved includes, variables, React import stripping
   - Supports toggling between `if`/`else` branches

3. **templateProcessor.ts**
   - **Engine detection** based on file extension and content patterns (Django vs Jinja vs Nunjucks)
   - **Inheritance resolution** (`{% extends %}` + `{% block %}`): recursively loads parent templates and merges blocks
   - **Include resolution** (`{% include %}`): recursive inlining with depth limiting
   - **Control flow mocking**:
     - `{% for %}`: renders body once with visual "repeats for each item" badge
     - `{% if %}` / `{% else %}`: renders one branch (toggleable), shows condition
     - Strips or replaces other tags (`{% load %}`, `{% static %}`, `{% url %}`, etc.)
   - **Variable mocking**: `{{ var }}` becomes either highlighted placeholder or plausible sample value
   - Unhandled tags become visible `<!-- HTMLens: unhandled tag {% foo %} -->` comments

4. **reactRenderer.ts**
   - Strips local `import` statements (with warning banner)
   - Detects default-exported component name
   - Generates a self-contained HTML with:
     - React 18 and ReactDOM from unpkg UMD builds
     - Babel standalone for in-browser transpilation (with React preset)
     - Global shims for common hooks
   - Renders into a `#he-root` div with error handling

## Development Setup

### Prerequisites

- Node.js 18+
- VS Code (latest)
- Git

### Initial Setup

```bash
git clone https://github.com/AnandShah10/HTMLens.git
cd HTMLens
npm install
```

### Running in Development Mode

1. Open the project folder in VS Code.
2. Press **F5** or select **Run → Start Debugging**.
   - This runs the `watch` task (TypeScript compiler in watch mode).
   - Launches an **Extension Development Host** window.
3. In the Extension Development Host:
   - Open an HTML, Django/Jinja template, JSX, or TSX file.
   - Click the preview icon in the editor title bar, or run **HTMLens: Open Preview to the Side** (`Ctrl/Cmd+Shift+P`).
4. Make changes to the source file — preview updates automatically.
5. Use **HTMLens: Toggle {% if %}/{% else %} Branch** to test conditionals.
6. Edit `src/` files — the extension will reload on save (thanks to the watch task).

**Debugging Tips:**
- Use the Debug Console in the first VS Code window.
- Set breakpoints in `src/` (they map to the compiled `out/`).
- Check the Developer Tools of the preview webview (right-click in preview → Inspect).

### Configuration for Development

The extension respects these settings (edit via `settings.json` or UI):

```json
{
  "htmlens.mockVariableStyle": "highlight",  // or "value"
  "htmlens.includeMaxDepth": 5
}
```

### Building & Packaging

```bash
# Compile TypeScript
npm run compile

# Package into .vsix
npm run package
```

The resulting `htmlens-*.vsix` can be installed via **Install from VSIX...** in any VS Code instance.

For publishing to the Marketplace, use `@vscode/vsce`:

```bash
npx @vscode/vsce publish
```

(See `package.json` for full scripts.)

## Adding Features / Extending the Mock Renderer

### Supporting New Template Tags

1. Update `detectEngine()` if needed.
2. Add regex and processing logic in `processControlFlow()` or dedicated functions in `templateProcessor.ts`.
3. Handle the tag in `resolveInheritance()` or `resolveIncludes()` if it's structural.
4. Update `mockValueFor()` for any new variable patterns.
5. Add test cases (consider adding a test suite with `mocha` + `@vscode/test-electron`).
6. Document in README.md and update CHANGELOG.md.
7. Consider edge cases: nested blocks, variable scoping, whitespace preservation, performance with large templates.

**Example:** To support `{% ifequal %}`:

```ts
// In processControlFlow()
const ifequalRe = /\{%\s*ifequal\s+([\s\S]*?)\s*%\}([\s\S]*?)\{%\s*endifequal\s*%\}/g;
// ... similar to ifRe
```

### Improving React Preview

- Add support for more hooks or context.
- Consider adding a simple module resolver for local components (challenging in webview).
- Support CSS-in-JS or styled-components (would require additional Babel plugins).
- Add prop mocking for component props.

### Testing Changes

Currently the project has no automated test suite. Recommended additions:

- Unit tests for `processTemplate()` with various template patterns.
- Integration tests using VS Code's test runner.
- Manual test cases in `test-fixtures/` directory (consider adding this).

Example test command (if added):

```bash
npm test
```

## Common Issues & Solutions

- **Preview not updating**: Check if the document URI matches `isPreviewing()`. Save the file (some listeners are on save).
- **Include/Extend resolution fails**: Verify the referenced file exists in workspace. The finder does recursive search but skips `node_modules`.
- **React component doesn't render**: Check console in webview for errors. Ensure there's a default export and no unresolved local imports.
- **CSP errors**: All scripts must use the nonce; external resources must be in the CSP meta tag.
- **Performance**: Large templates with deep recursion may hit `maxIncludeDepth`. The file search in `findByBasename()` has a guard against infinite recursion.

## Git Workflow

- Branch from `master`
- Use conventional commit messages (see CHANGELOG.md updates)
- Keep PRs focused on one feature/bugfix
- Update documentation when behavior changes

## Resources

- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Django Template Docs](https://docs.djangoproject.com/en/stable/ref/templates/)
- [Jinja2 Docs](https://jinja.palletsprojects.com/)
- [Babel Standalone](https://babeljs.io/docs/babel-standalone)

For questions, open an issue on GitHub or reach out to the maintainer.

Happy hacking! 🚀
