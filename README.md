# OneShot Dialogue VS Code Extension (Temporary)

This folder is a temporary stand-in repository for a future dedicated VS Code extension project.

## Included

- Language registration for `*.dlg` files.
- Comment support (`# ...`).
- Bracket/quote auto-closing and surrounding pairs.
- TextMate grammar with highlighting for:
  - Scene and flow-control keywords (`scene`, `say`, `if`, `choice`, etc.)
  - Named args (`actor`, `portrait`, `side`, `speed`, `color`, `effect`, `voice`, `crossfade`)
  - Booleans, numbers, and hex colors
  - Inline override blocks (`{color=#ff4444}`, `{effect}`)

## Next steps (when moving to a real repo)

1. Copy this folder into a new extension repository.
2. Add a `LICENSE` and publisher-specific metadata.
3. Run `vsce package` to build a `.vsix`.
4. Add tests (`vscode-test`) and optional snippets/completions.

## Source format reference

The grammar targets the structure described in:

- `assets/data/dialogue/FORMAT.md`
