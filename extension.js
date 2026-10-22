// @ts-check
const vscode = require('vscode');

const MODE = 'mdReader.mode'; // 'auto' | 'light' | 'dark'; auto follows the VS Code theme
const LAYOUT = 'mdReader.layout'; // 'column' | 'paper'

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const state = context.globalState;
  const mode = () => state.get(MODE, 'auto');
  const layout = () => state.get(LAYOUT, 'column');
  const columnWidth = () => {
    const value = Number(vscode.workspace.getConfiguration('mdReader').get('columnWidth', 80));
    return Number.isFinite(value) ? Math.min(200, Math.max(40, value)) : 80;
  };

  const themeIsDark = () => {
    const kind = vscode.window.activeColorTheme.kind;
    return kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
  };

  const refresh = () => vscode.commands.executeCommand('markdown.preview.refresh');

  context.subscriptions.push(
    vscode.commands.registerCommand('mdReader.toggleMode', async () => {
      const dark = mode() === 'auto' ? themeIsDark() : mode() === 'dark';
      // Flipping back to the theme's own mode means "follow the theme" again.
      const next = dark === !themeIsDark() ? 'auto' : dark ? 'light' : 'dark';
      await state.update(MODE, next);
      await refresh();
    }),
    vscode.commands.registerCommand('mdReader.toggleLayout', async () => {
      await state.update(LAYOUT, layout() === 'paper' ? 'column' : 'paper');
      await refresh();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('mdReader.columnWidth')) {
        refresh();
      }
    }),
  );

  return {
    /** @param {any} md markdown-it instance of the built-in preview */
    extendMarkdownIt(md) {
      // Tokens are cached per document version, but render() runs on every refresh,
      // so the state marker and the column width are injected here rather than in a core rule.
      // The marker stays last so `.md-reader-state + *` in reader.css is the first real block.
      const render = md.renderer.render.bind(md.renderer);
      md.renderer.render = (tokens, options, env) =>
        `<style>html:root { --r-measure: ${columnWidth()}ch; }</style>` +
        `<div class="md-reader-state" data-mode="${mode()}" data-layout="${layout()}" hidden></div>` +
        render(tokens, options, env);

      // GFM task lists ("- [ ] item", "- [x] item") as disabled checkboxes; the built-in preview has none.
      md.core.ruler.push('md_reader_task_lists', (state) => {
        const tokens = state.tokens;
        for (let i = 2; i < tokens.length; i++) {
          const inline = tokens[i];
          if (inline.type !== 'inline' || tokens[i - 1].type !== 'paragraph_open' || tokens[i - 2].type !== 'list_item_open') {
            continue;
          }
          const match = /^\[([ xX])\] /.exec(inline.content);
          const first = inline.children && inline.children[0];
          if (!match || !first || first.type !== 'text' || !first.content.startsWith(match[0])) {
            continue;
          }
          first.content = first.content.slice(match[0].length);
          const box = new state.Token('html_inline', '', 0);
          box.content = `<input type="checkbox" class="md-reader-task" disabled${match[1] === ' ' ? '' : ' checked'}>`;
          inline.children.unshift(box);
          tokens[i - 2].attrJoin('class', 'md-reader-task-item');
        }
      });

      // Wrap tables so wide ones scroll sideways while narrow ones still fill the column.
      const wrap = (rule, before, after) => {
        const original = md.renderer.rules[rule];
        md.renderer.rules[rule] = (tokens, idx, options, env, self) =>
          before + (original ? original(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)) + after;
      };
      wrap('table_open', '<div class="md-reader-table">', '');
      wrap('table_close', '', '</div>');

      return md;
    },
  };
}

module.exports = { activate };
