# Markdown Reader

A local VS Code extension that restyles the built-in Markdown preview (⇧⌘V, ⌘K V) for long reading: Roboto body, Montserrat headings, Menlo in always-dark code blocks, task-list checkboxes, a preview-only light/dark switch and a paper-page layout. Plain CSS and JS, no build, no dependencies. Fonts are bundled (OFL 1.1, `fonts/OFL-*.txt`).

## Use

| Command palette: "Markdown Reader: …" | Key |
|---|---|
| Toggle Light/Dark | ⌃⌘L |
| Toggle Paper Layout | ⌃⌘P |

- Light/Dark changes only the preview. Toggling back to the editor theme's own mode returns to following the VS Code theme. The choice persists.
- Column (default): a ~72ch column; wide tables and long code lines scroll sideways inside it. Paper: a 64ch page on a darker surround.

## Install / reinstall

```bash
pnpm dlx @vscode/vsce@4.0.0 package --no-dependencies --skip-license --allow-missing-repository
code --install-extension md-reader-0.1.0.vsix --force
```

Then **Developer: Reload Window**: the preview loads markdown-it plugins once per window.

## Edit

Sizes, widths and colours are custom properties at the top of `reader.css`. Open `specimen.md` with ⇧⌘V to check every element after a change.

## Relies on

- The built-in preview and VS Code's built-in Mermaid support (1.136+).
- Markdown Preview Enhanced not being installed: it takes ⇧⌘V and ⌘K V.
