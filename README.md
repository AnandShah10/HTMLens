# HTMLens — Universal Template & HTML Previewer

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://marketplace.visualstudio.com/items?itemName=AnandShah.htmlens)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=AnandShah.htmlens)

**Live preview for HTML, Django/Jinja/Nunjucks templates, and React/JSX components — directly in VS Code.**

HTMLens provides instant, intelligent previews for a wide range of web and template files without leaving your editor. Perfect for frontend developers, Django engineers, and anyone working with component-based UIs.

**Links**: [Changelog](CHANGELOG.md) | [Development Guide](DEVELOPMENT.md) | [Contributing](CONTRIBUTING.md) | [Report an Issue](https://github.com/AnandShah10/HTMLens/issues)

## ✨ Features

- **Universal Support**: Seamlessly handles plain HTML, Django templates, Jinja2, Nunjucks, JSX, and TSX files.
- **Smart Template Mocking**: 
  - Renders `{{ variables }}` as highlighted placeholders or realistic sample values (configurable).
  - Intelligently handles `{% if %}`/`{% else %}`, `{% for %}`, `{% extends %}`, `{% include %}`, and common tags.
  - Resolves template inheritance and includes by searching your workspace (with depth limiting to prevent cycles).
- **React/JSX Preview**: In-browser transpilation using Babel Standalone (React preset) + React 18 from CDN. Supports JSX syntax and common hooks; renders default-exported components instantly.
- **Live Updates**: Automatic preview refresh on file changes with debounced updates.
- **Interactive Controls**: Toggle between `if`/`else` branches directly from the command palette.
- **Webview Enhancements**: Proper CSP, asset path rewriting for CSS/JS/images, informative warning banners for unresolved elements.
- **Lightweight & Fast**: No heavy dependencies — everything runs in the VS Code webview.

## 📸 Screenshots

Representative screenshots (as SVGs) and ready-to-use demo files are provided in the [`examples/`](https://github.com/AnandShah10/HTMLens/tree/main/examples) and [`media/`](https://github.com/AnandShah10/HTMLens/tree/main/media) directories of the repository.

> *The diagrams illustrate: live HTML preview with styling, Django/Jinja mock rendering (variables, conditionals, loops, unhandled tag warnings), React component rendering with interactive state/hooks and import warnings, and full template inheritance resolution with merged blocks.*

**Try the demos yourself**:
- Clone the repo and open `examples/html-example.html`, `examples/django-example.html` (and `base.html`), or `examples/react-example.jsx`.
- Use the command **HTMLens: Open Preview to the Side** (or click the preview icon in the editor title bar).
- Edit the files to see live updates, use the toggle command for conditionals, or interact with the React component.

### Demo Files (`examples/`)
- `html-example.html` + `styles.css` — Standard HTML with CSS; demonstrates asset path rewriting in the webview.
- `django-example.html` (with `base.html`) — Complex template using variables, `{% if %}`/`{% else %}`, `{% for %}`, `{% extends %}`, `{% block %}`, and unhandled tags.
- `react-example.jsx` — Modern JSX with `useState`, `useEffect`, inline styles, and a default export (transpiled via Babel React preset at preview time).

## 🚀 Installation

### From VS Code Marketplace (Recommended)

1. Open **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2. Search for **"HTMLens"**.
3. Click **Install**.

### Manual Installation

Download the latest `.vsix` from the [Releases](https://github.com/AnandShah10/HTMLens/releases) page or build it yourself (see below), then:

- In VS Code: Extensions view → `...` → **Install from VSIX...**
- Or run: `code --install-extension htmlens-1.0.2.vsix`

## 📖 Supported File Types & Behavior

| File Type | Extension(s) | Preview Behavior |
|-----------|--------------|------------------|
| **HTML** | `.html`, `.htm` | Standard live preview with automatic rewriting of relative asset paths (`<img>`, `<link>`, `<script>`) to work within the webview sandbox. |
| **Django/Jinja/Nunjucks** | `.django`, `.jinja`, `.jinja2`, `.j2`, `.njk` | **Mock rendering engine**:<br>• Variables rendered as placeholders or mock values<br>• Conditional logic (`{% if %}`/`{% else %}`) with toggle support<br>• Loops (`{% for %}`) rendered once with annotation<br>• Full template inheritance (`{% extends %}` + `{% block %}`) and recursive includes resolved from workspace files<br>• Unhandled tags preserved as visible HTML comments |
| **React** | `.jsx`, `.tsx` | **In-browser transpilation & render** using Babel Standalone (with React preset) + React 18 (via CDN). JSX is automatically transformed; local imports are stripped with a warning banner. Ideal for quick single-component previews. |

*Engine detection is automatic based on file extension and content patterns.*

## ⌨️ Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) or editor title bar icon:

- **HTMLens: Open Preview** — Open preview in a new tab.
- **HTMLens: Open Preview to the Side** — Split view (recommended).
- **HTMLens: Refresh Preview** — Force refresh the current preview.
- **HTMLens: Toggle {% if %}/{% else %} Branch** — Switch rendered conditional branch.

A preview icon appears automatically in the editor title bar for supported files.

## ⚙️ Configuration

Search for "htmlens" in VS Code Settings (`Ctrl+,`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `htmlens.mockVariableStyle` | `string` | `"highlight"` | How to render template variables: `"highlight"` (styled placeholder) or `"value"` (plausible sample data based on variable name). |
| `htmlens.includeMaxDepth` | `number` | `5` | Maximum recursion depth for resolving `{% extends %}` and `{% include %}` to prevent infinite loops. |

## 🔍 How It Works

- **Template Processor**: Detects engine, resolves inheritance/includes, mocks control structures and variables while preserving structure.
- **React Renderer**: Strips React/local imports, transpiles JSX via Babel Standalone (React preset), and mounts the default-exported component in a sandboxed React 18 environment.
- **Preview Panel**: Singleton Webview with proper security (CSP + nonce), asset URI mapping via `asWebviewUri`, and live update listeners.
- **Extension Core**: Registers commands, handles document change/save events with debouncing for performance.

See [DEVELOPMENT.md](DEVELOPMENT.md) for full architecture details, debugging instructions, and guidance on adding new features (e.g., additional template tags or React hook support).

## ⚠️ Known Limitations

- **React Preview**: Not a full bundler. Multi-file components, local CSS modules, or complex npm dependencies may not resolve. Designed for quick single-component validation.
- **Template Tags**: Unhandled or custom tags/filters appear as visible `<!-- HTMLens: unhandled tag {% foo %} -->` comments (better transparency than silent failure).
- **File Resolution**: `{% extends %}` and `{% include %}` search only within the open workspace (skipping `node_modules`). Custom template loaders with external paths may require manual adjustment.
- **Performance**: Deeply nested includes or very large templates may hit configured depth limits.

These are intentional design choices to keep the extension lightweight and focused on fast previews.

## 🛠️ Development & Contributing

See:
- [DEVELOPMENT.md](DEVELOPMENT.md) — Architecture, setup, building, extending the mock renderer.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Guidelines, code standards, PR process.

**Quick Development Setup**:
```bash
git clone https://github.com/AnandShah10/HTMLens.git
cd HTMLens
npm install
# Press F5 in VS Code to start debugging
```

**Build Commands**:
```bash
npm run compile          # TypeScript → JavaScript
npm run package          # Create .vsix package
```

We welcome contributions! Please follow conventional commits and update documentation/CHANGELOG as needed.

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute.

---

**Made with ❤️ for the developer community.** Questions or feedback? [Open an issue](https://github.com/AnandShah10/HTMLens/issues) on GitHub.

*Keywords: django preview, jinja2 preview, nunjucks live preview, react jsx preview, html live preview, template mocking, vs code extension*
