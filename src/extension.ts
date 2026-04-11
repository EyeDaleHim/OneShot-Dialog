import * as vscode from "vscode";

// ---------------------------------------------------------------------------
// Hover documentation
// ---------------------------------------------------------------------------

/**
 * Markdown hover text for every keyword the language server knows about.
 * Covers: scene/params block keys, say arguments, inline override keys,
 * statement commands, and block/flow control keywords.
 */
const HOVER_DOCS: Record<string, string> = {
  // --- Scene-level params block keys ---
  speed:
    "**`speed`** — Controls how fast text scrolls onto the screen, measured in characters per second. "
    + "Accepts a positive float (e.g. `12`, `8.5`). Higher values make text appear faster; "
    + "lower values give a slow typewriter feel. Applies to every `say` line in the scene "
    + "unless overridden per-line or mid-text with `{speed=…}`.",

  color:
    "**`color`** — Sets the default text colour for `say` lines in this scene. "
    + "Must be a six-digit hex literal (e.g. `#ff4444`, `#aaaaff`). "
    + "Use `none` to fall back to the engine default. "
    + "Can be overridden per-line or mid-sentence with `{color=#rrggbb}`.",

  effect:
    "**`effect`** — Applies a per-character animation to scrolling text. "
    + "Accepted values: `none`, `shake`, `wave`, `flicker`, `rainbow`. "
    + "Defaults to `none` (plain text). Can be overridden per-line or "
    + "mid-sentence with `{effect=wave}` inside dialogue text.",

  side:
    "**`side`** — Controls which side of the screen the character portrait appears on. "
    + "Accepted values: `left`, `right`. Defaults to `left`. "
    + "Can be overridden on individual `say` lines with `side=right`.",

  voice:
    "**`voice`** — Asset ID of the voice-blip sound played while text scrolls. "
    + "Must be a quoted string matching a registered sound asset "
    + "(e.g. `\"niko_voice\"`). Omitting this key falls back to the engine default blip. "
    + "Can be overridden on individual `say` lines.",

  // --- say-line arguments (same keys, slightly different framing) ---
  actor:
    "**`actor`** — The character name shown in the dialogue nameplate. "
    + "Must be a quoted string (e.g. `actor=\"Niko\"`). "
    + "Omitting `actor` produces narration — no nameplate is displayed.",

  portrait:
    "**`portrait`** — Path to the character's portrait image, relative to "
    + "`assets/images/portraits/` and without a file extension "
    + "(e.g. `portrait=\"niko/happy\"`). "
    + "Omitting this argument keeps whichever portrait was last shown. "
    + "Use `portrait=none` to explicitly clear the portrait.",

  crossfade:
    "**`crossfade`** — Duration in seconds over which the engine fades from the current "
    + "music track to the new one. Accepts a positive float (e.g. `crossfade=2.0`). "
    + "Defaults to `0` (immediate cut). Only valid on `music` commands.",

  volume:
    "**`volume`** — Playback volume for the music or sfx track, from `0.0` (silent) to `1.0` (full). "
    + "Accepts a float. Defaults to `1.0`.",

  // --- Block / flow-control keywords ---
  scene:
    "**`scene`** — Declares a named scene block. The engine begins at the first scene "
    + "in the file unless directed elsewhere. Scene IDs may contain letters, digits, "
    + "and underscores.",

  params:
    "**`params`** — Optional block at the very top of a scene that sets default "
    + "presentation values (`speed`, `color`, `effect`, `side`, `voice`) for every "
    + "`say` line in that scene. Keys omitted here fall back to engine defaults.",

  say:
    "**`say`** — Displays a line of text. Without `actor=` it is narration (no nameplate). "
    + "With `actor=` it is character dialogue. Accepts optional arguments: "
    + "`actor`, `portrait`, `side`, `speed`, `color`, `effect`, `voice`.",

  music:
    "**`music`** — Switches the background music track. Accepts a bare asset ID and an "
    + "optional `crossfade=<seconds>` argument for a smooth transition.",

  sfx:
    "**`sfx`** — Plays a one-shot sound effect immediately. Accepts a bare asset ID.",

  flag:
    "**`flag`** — Sets a save-persistent flag to a value. "
    + "Values may be `true`, `false`, an integer, or a double-quoted string "
    + "(e.g. `flag player_name = \"Niko\"`).",

  call:
    "**`call`** — Invokes a named HScript function registered with the engine "
    + "(e.g. `call openNikoDoor`). The function must be registered before the scene runs.",

  goto:
    "**`goto`** — Jumps immediately to another scene in the same file. "
    + "Execution of the current scene stops at this point.",

  if:
    "**`if`** — Evaluates a flag condition (`==` or `!=`) and runs the indented block "
    + "when the condition is true. An optional `else:` block runs when it is false. "
    + "Conditions may be nested.",

  else:
    "**`else`** — Optional branch of an `if` block. Runs when the preceding `if` "
    + "condition evaluated to false.",

  choice:
    "**`choice`** — Presents the player with a set of labelled options. "
    + "Each `option` has a double-quoted label and an indented body. "
    + "Options can be made conditional with `if flag == value` after the label.",

  option:
    "**`option`** — A single selectable entry inside a `choice` block. "
    + "Takes a double-quoted label and an optional `if flag == value` condition "
    + "that hides the option when not met.",
};

// ---------------------------------------------------------------------------
// Type rules
// ---------------------------------------------------------------------------

/** Args that must receive a bare numeric literal (integer or float). */
const NUMERIC_ARGS = new Set(["speed", "crossfade", "volume"]);

/** Args that must receive a quoted string. */
const STRING_ARGS = new Set(["actor", "portrait", "voice", "effect"]);

/** `side` is an enum: only these bare words are valid. */
const SIDE_VALUES = new Set(["left", "right", "none"]);

// Regex to lex named arguments anywhere on a line: key = value
// Captures: [1] key  [2] value token (quoted string, hex color, or bare word/number)
const ARG_RE =
  /\b(actor|portrait|side|speed|color|effect|voice|crossfade|volume)\s*=\s*("(?:[^"\\]|\\.)*"|#[0-9A-Fa-f]{6}\b|\S+)/g;

// Inline-override block: {key=value ...}
const INLINE_BLOCK_RE = /\{([^}]*)\}/g;
// Key=value inside an inline block (only the three inline-valid keys)
const INLINE_ARG_RE = /\b(color|effect|speed)\s*=\s*("(?:[^"\\]|\\.)*"|#[0-9A-Fa-f]{6}\b|\S+)/g;

// Valid hex color
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

// ---------------------------------------------------------------------------
// Diagnostic collection (singleton)
// ---------------------------------------------------------------------------
let diagnosticCollection: vscode.DiagnosticCollection;

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("oneshot-dlg");
  context.subscriptions.push(diagnosticCollection);

  // Validate all already-open .dlg docs on startup
  for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === "dlg") validateDocument(doc);
  }

  // Re-validate on open / change / close
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === "dlg") validateDocument(doc);
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === "dlg") validateDocument(e.document);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticCollection.delete(doc.uri);
    }),

    // Hover provider — show docs for any known keyword under the cursor
    vscode.languages.registerHoverProvider({ language: "dlg" }, {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
        if (!range) return undefined;
        const word = document.getText(range);
        const doc = HOVER_DOCS[word];
        if (!doc) return undefined;
        return new vscode.Hover(new vscode.MarkdownString(doc), range);
      },
    })
  );
}

export function deactivate(): void {
  diagnosticCollection?.dispose();
}

// ---------------------------------------------------------------------------
// Core validator
// ---------------------------------------------------------------------------
function validateDocument(doc: vscode.TextDocument): void {
  const diagnostics: vscode.Diagnostic[] = [];

  for (let lineIdx = 0; lineIdx < doc.lineCount; lineIdx++) {
    const line = doc.lineAt(lineIdx);
    const text = line.text;

    // Skip comment lines and blank lines
    const trimmed = text.trimStart();
    if (trimmed.startsWith("#") || trimmed === "") continue;

    // Strip the comment portion (anything after a bare # not inside a string or hex color)
    const strippedText = stripComment(text);

    // --- Named argument validation (top-level line) ---
    checkNamedArgs(strippedText, lineIdx, 0, diagnostics, false);

    // --- Inline override block validation ({ ... }) ---
    INLINE_BLOCK_RE.lastIndex = 0;
    let blockMatch: RegExpExecArray | null;
    while ((blockMatch = INLINE_BLOCK_RE.exec(strippedText)) !== null) {
      const blockContent = blockMatch[1];
      const blockOffset = blockMatch.index + 1; // offset of content start (after '{')
      checkNamedArgs(blockContent, lineIdx, blockOffset, diagnostics, true);

      // Warn on bare reset tags used outside of a quoted string context.
      // {key} with no value is valid inside dialogue text (it resets the
      // override), but when the { } block appears on a non-string line it
      // almost certainly means the author forgot the "=value" part.
      checkBareInlineTags(blockContent, blockMatch.index, lineIdx, strippedText, diagnostics);
    }
  }

  diagnosticCollection.set(doc.uri, diagnostics);
}

// ---------------------------------------------------------------------------
// Named-argument checker
// ---------------------------------------------------------------------------
function checkNamedArgs(
  text: string,
  lineIdx: number,
  charOffset: number,
  diagnostics: vscode.Diagnostic[],
  isInline: boolean
): void {
  const re = isInline ? INLINE_ARG_RE : ARG_RE;
  re.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    const rawValue = m[2];

    // Position of the value token within the original line
    const valueStart = m.index + m[0].indexOf(rawValue);
    const valueEnd = valueStart + rawValue.length;

    const range = new vscode.Range(
      lineIdx,
      charOffset + valueStart,
      lineIdx,
      charOffset + valueEnd
    );

    const err = checkArgValue(key, rawValue, isInline);
    if (err) {
      const diag = new vscode.Diagnostic(
        range,
        err,
        vscode.DiagnosticSeverity.Error
      );
      diag.source = "oneshot-dlg";
      diagnostics.push(diag);
    }
  }
}

// ---------------------------------------------------------------------------
// Single arg-value checker — returns an error message or null
// ---------------------------------------------------------------------------
function checkArgValue(
  key: string,
  rawValue: string,
  isInline: boolean
): string | null {
  const isQuoted = rawValue.startsWith('"');
  const isHex = HEX_COLOR_RE.test(rawValue);
  const isNumber = !isQuoted && /^\d+(\.\d+)?$/.test(rawValue);
  const isIdentifier =
    !isQuoted && !isHex && /^[A-Za-z_][A-Za-z0-9_]*$/.test(rawValue);

  const context = isInline ? "inline override" : "argument";

  // ----- Numeric args: speed, crossfade, volume -----
  if (NUMERIC_ARGS.has(key)) {
    if (isQuoted) {
      return `'${key}' expects a number, not a quoted string (${context}).`;
    }
    if (isIdentifier) {
      return `'${key}' expects a number, not an identifier "${rawValue}" (${context}).`;
    }
    return null;
  }

  // ----- String args: actor, portrait, voice, effect -----
  if (STRING_ARGS.has(key)) {
    if (isNumber) {
      return `'${key}' expects a quoted string, not a number (${context}).`;
    }
    return null;
  }

  // ----- side -----
  if (key === "side") {
    if (isQuoted) {
      return `'side' expects a bare keyword (left, right, none), not a quoted string.`;
    }
    if (isNumber) {
      return `'side' expects a keyword (left, right, none), not a number.`;
    }
    if (isIdentifier && !SIDE_VALUES.has(rawValue)) {
      return `'side' must be "left", "right", or "none" — got "${rawValue}".`;
    }
    return null;
  }

  // ----- color -----
  if (key === "color") {
    if (isHex) return null;
    if (rawValue === "none") return null;
    if (isQuoted) {
      return `'color' expects a hex literal (#RRGGBB) or "none", not a quoted string.`;
    }
    if (isNumber) {
      return `'color' expects a hex literal (#RRGGBB) or "none", not a number.`;
    }
    if (isIdentifier) {
      return `'color' expects a hex literal (#RRGGBB) or "none" — got "${rawValue}".`;
    }
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Bare inline-tag checker
// ---------------------------------------------------------------------------

/**
 * Emits a Warning when a `{key}` reset token (no `=value`) appears in a
 * context where it is almost certainly unintentional — specifically when
 * the surrounding line is NOT inside a quoted dialogue string.
 *
 * Reset tokens are only meaningful inside quoted text (they restore the
 * per-character override back to the line default). Outside of a string
 * they are silently swallowed by the engine but produce no effect and
 * frequently indicate a missing `=value`.
 */
function checkBareInlineTags(
  blockContent: string,
  blockStart: number,  // index of '{' in the stripped line
  lineIdx: number,
  fullLine: string,
  diagnostics: vscode.Diagnostic[]
): void {
  // Only warn when this { } block does NOT sit inside a quoted string on
  // the same line.  We detect that by checking whether the character
  // immediately before the '{' that opened this block is inside a quoted
  // region.
  if (isInsideString(fullLine, blockStart)) return;

  // A bare reset token has no '=' inside it and matches one of the three
  // inline-valid keys exactly (no trailing characters).
  const BARE_INLINE_RE = /^(color|effect|speed)$/;
  const trimmed = blockContent.trim();
  if (!BARE_INLINE_RE.test(trimmed)) return;

  // The diagnostic range covers the whole { key } token.
  const tokenStart = blockStart;                        // index of '{'
  const tokenEnd   = blockStart + blockContent.length + 2; // +2 for { and }
  const range = new vscode.Range(lineIdx, tokenStart, lineIdx, tokenEnd);

  const diag = new vscode.Diagnostic(
    range,
    `'{${trimmed}}' is a reset tag that only takes effect inside quoted dialogue text. Did you mean '{${trimmed}=<value>}'?`,
    vscode.DiagnosticSeverity.Warning
  );
  diag.source = "oneshot-dlg";
  diagnostics.push(diag);
}

/**
 * Returns true when the character at `index` in `line` falls inside a
 * double-quoted string region (respecting `\\` escapes).
 */
function isInsideString(line: string, index: number): boolean {
  let inString = false;
  for (let i = 0; i < index && i < line.length; i++) {
    if (line[i] === '"' && (i === 0 || line[i - 1] !== '\\')) {
      inString = !inString;
    }
  }
  return inString;
}

// ---------------------------------------------------------------------------
// Strip trailing line comment (# not inside a string, not a hex color)
// ---------------------------------------------------------------------------
function stripComment(text: string): string {
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && (i === 0 || text[i - 1] !== "\\")) {
      inString = !inString;
      continue;
    }
    if (!inString && ch === "#") {
      // Don't strip if it's the start of a hex color literal (#RRGGBB)
      const ahead = text.slice(i + 1, i + 7);
      if (/^[0-9A-Fa-f]{6}\b/.test(ahead)) continue;
      return text.slice(0, i);
    }
  }
  return text;
}
