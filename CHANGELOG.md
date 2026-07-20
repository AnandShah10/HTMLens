# Changelog

All notable changes to HTMLens will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2024-10-05

### Added
- Comprehensive `examples/` directory with practical fixtures for all preview modes (HTML, Django/Jinja with inheritance & control flow, React/JSX, shared CSS).
- Four SVG diagram placeholders in `media/` representing the four core features for README screenshots.
- `media/icon.png` and `media/icon.svg`.

### Changed
- Major documentation overhaul:
  - `README.md`: Professional Marketplace-ready presentation with badges, hero section, feature highlights, limitations, scannable tables, SEO keywords, and cross-links.
  - `DEVELOPMENT.md`: Updated architecture diagram, improved dev workflow, testing recommendations.
  - `CONTRIBUTING.md`: Polished guidelines with badges, detailed bug/feature/PR processes, coding standards, visual contribution section, conventional commits, and maintainer release steps.
- Updated `examples/react-example.jsx` to demonstrate native JSX syntax (leveraging Babel React preset transpilation in the preview).
- Bumped version to **1.0.2**.
- Updated `package.json` packaging script to use `npx @vscode/vsce` (no global dependency required).
- Synced version references across docs.

### Fixed
- Inconsistent version references, project layout diagrams, and release instructions.
- Minor formatting and cross-linking improvements.
- SVG restriction error during VS Code Marketplace packaging: replaced embedded SVG images in `README.md` with links to the repository's `media/` and `examples/` (SVGs retained in repo for reference).
- Updated `.vscodeignore` for cleaner packaging (exclude `*.log`, `*.vsix` files).

## [1.0.0] - 2024-10-04

### Added
- Live preview support for plain HTML with proper asset path rewriting for webview sandbox.
- Mock rendering engine for Django templates, Jinja2, Nunjucks (`.django`, `.jinja`, `.jinja2`, `.j2`, `.njk`):
  - Variable placeholders (`{{ var }}`)
  - Conditional blocks with toggle command (`{% if %}` / `{% else %}`)
  - Loop simulation for `{% for %}`
  - Template inheritance (`{% extends %}` + `{% block %}`)
  - Recursive includes (`{% include %}`)
- React/JSX (`.jsx`, `.tsx`) preview using in-browser Babel transpilation and React 18 from CDN.
- Command palette and editor title bar integration.
- Configurable mock variable rendering (`highlight` or `value` style).
- Configurable max recursion depth for includes/extends.
- Automatic live refresh on file save (debounced).

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)
