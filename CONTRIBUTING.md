# Contributing to HTMLens

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/AnandShah10/HTMLens/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/AnandShah10/HTMLens/pulls)

Thank you for your interest in contributing to **HTMLens**! We welcome bug reports, feature requests, code improvements, documentation updates, and new template feature support.

This document complements the [DEVELOPMENT.md](./DEVELOPMENT.md) and polished [README.md](./README.md).

## Code of Conduct

Please be respectful and follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## How to Contribute

### Reporting Bugs

1. Search the [issue tracker](https://github.com/AnandShah10/HTMLens/issues) to avoid duplicates.
2. Create a new issue with:
   - A clear, descriptive title (e.g., "Preview fails to resolve nested {% include %} in Jinja2")
   - Detailed steps to reproduce (include sample files from `examples/`)
   - Expected vs. actual preview behavior
   - Screenshots of the preview/webview errors if applicable
   - Environment: VS Code version, OS, HTMLens version (`1.0.1`), file type
   - Relevant template snippet or attach file from `examples/`

### Suggesting Features

1. Check existing issues, discussions, and the [roadmap in README](https://github.com/AnandShah10/HTMLens#roadmap).
2. Open a feature request issue describing:
   - The new template tag, React feature, or enhancement
   - Real-world use cases and benefits (e.g., better support for Wagtail templates)
   - Proposed implementation approach (reference `src/templateProcessor.ts` or `src/reactRenderer.ts`)
   - Any potential screenshots or examples

### Submitting Pull Requests

1. Fork the repo and create a branch from `master` (`git checkout -b feature/amazing-feature`).
2. Follow the [Development Setup](./DEVELOPMENT.md).
3. Make focused changes; keep PRs small and atomic.
4. Use [conventional commit messages](https://www.conventionalcommits.org/) (e.g. `feat: add support for {% verbatim %} tag`).
5. Test your changes using the files in `examples/` and by running the extension via **F5**.
6. Update documentation (README.md, DEVELOPMENT.md, CHANGELOG.md) where appropriate.
7. Ensure the extension builds cleanly (`npm run compile`) and the packaged VSIX works.
8. Push your branch and open a PR against `master` with a clear description and screenshots of new behavior.
9. Link any related issues.

All PRs should pass manual review against the four main preview modes (HTML, Django/Jinja mock, React/JSX, inheritance).

## Development Setup

See **[DEVELOPMENT.md](./DEVELOPMENT.md)** for:

- Full project architecture diagram (now including `examples/` and `media/`)
- How to run in Extension Development Host (F5)
- Debugging the webview
- Adding new template tags or improving React renderer
- Common issues

The `examples/` directory contains ready-to-use fixtures for all four preview modes — use them when developing or testing changes.

## Coding Standards

- **TypeScript**: Strict types, no `any` where avoidable. Follow patterns in existing files.
- **Code Style**: Match the existing codebase (4-space indent, clear variable names). ESLint/Prettier can be added in a future PR.
- **Comments**: Document complex regexes, inheritance merging logic, and React Babel setup in `src/`.
- **Performance**: Live updates use a 250ms debounce. Keep template processing efficient (avoid deep recursion beyond configured `includeMaxDepth`).
- **Webview Security**: Always use nonces for scripts, respect CSP, sanitize where necessary.
- **Accessibility**: Ensure preview content is readable; consider high-contrast support in future.

## Visual & Documentation Contributions

- New screenshots should be added to `media/` (prefer optimized SVGs or GIFs demonstrating live updates).
- Update the feature table and screenshots section in `README.md`.
- Use the `examples/` files to generate consistent before/after visuals.
- Keep Marketplace presentation professional (benefit-focused language, scannable tables).

## Adding Support for New Template Features

See the dedicated section in **[DEVELOPMENT.md](./DEVELOPMENT.md#adding-features--extending-the-mock-renderer)**.

Key files:
- `src/templateProcessor.ts` — engine detection, inheritance, includes, control flow mocking, variable substitution.
- `src/previewPanel.ts` — banner injection for warnings about unresolved variables/includes.
- `src/reactRenderer.ts` — for JSX/TSX improvements.

When submitting:
- Add test cases to the `examples/` fixtures.
- Update the supported file types table in README.
- Document edge cases handled.
- Increment the Unreleased section in CHANGELOG.md.

## Releasing (Maintainers)

1. Update version in `package.json` (follow semver).
2. Update `[Unreleased]` section in [CHANGELOG.md](./CHANGELOG.md) and move it to a new version header.
3. Run `npm run compile` then `npm run package` (produces `htmlens-*.vsix`).
4. Test the VSIX in a clean VS Code instance with all example files.
5. Update `README.md` screenshots if UI changed.
6. Commit, tag the release (`git tag v1.0.2`), push, and create a GitHub Release attaching the VSIX.
7. Publish to Marketplace: `npx @vscode/vsce publish`.

We appreciate your contributions to making HTMLens the best live previewer for templates and React components!

**Happy hacking!** 🚀
