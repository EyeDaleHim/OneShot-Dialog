import * as vscode from "vscode";

// ---------------------------------------------------------------------------
// Hover documentation
// ---------------------------------------------------------------------------

/**
 * Markdown hover text for every keyword the language server knows about.
 * Covers: scene/params block keys, say arguments, inline override keys,
 * statement commands, block/flow control keywords, and enum values.
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

  position:
    "**`position`** — Controls the vertical placement of the dialogue box. "
    + "Accepted values: `top`, `bottom`, `center`. Defaults to `bottom`. "
    + "Set in the scene `params` block; not available as a per-line override.",

  voice:
    "**`voice`** — Asset ID of the voice-blip sound played while text scrolls. "
    + "Relative to `sfx/dialogue/`. Use `\"\"` (empty string) to silence blips. "
    + "Defaults to `text`. Can be overridden on individual `say` lines.",

  blipStyle:
    "**`blipStyle`** — Controls how voice blips are played. "
    + "`monophonic` — One sound instance, stopped and restarted every tick. "
    + "`polyphonic` — Pool of sound instances; allows layering. "
    + "`solophonic` — One sound instance, not restarted; ignored if already playing. "
    + "Defaults to `monophonic`. Set in the scene `params` block.",

  // --- say-line arguments ---
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

  force:
    "**`force`** — When `true`, the dialogue line auto-advances to the next node "
    + "when the typewriter finishes, without requiring player input. "
    + "Accepts `true` or `false`. Only valid on `say` lines.",

  // --- voice_blip arguments ---
  sound:
    "**`sound`** — Asset ID of the blip sound for `voice_blip` commands. "
    + "Relative to `sfx/dialogue/`. Use `\"\"` to silence blips from this point onward. "
    + "Example: `voice_blip sound=text`",

  style:
    "**`style`** — Playback style for voice blips in a `voice_blip` command. "
    + "Accepted values: `monophonic`, `polyphonic`, `solophonic`. "
    + "Example: `voice_blip style=polyphonic`",

  // --- Inline override keys ---
  delay:
    "**`delay`** — Pauses the typewriter for the specified number of seconds. "
    + "Accepts a positive float (e.g. `{delay=1.5}`). One-shot — there is no reset form. "
    + "Only valid inside inline overrides within dialogue text.",

  // --- Block / flow-control keywords ---
  scene:
    "**`scene`** — Declares a named scene block. The engine begins at the first scene "
    + "in the file unless directed elsewhere. Scene IDs may contain letters, digits, "
    + "and underscores.",

  params:
    "**`params`** — Optional block at the very top of a scene that sets default "
    + "presentation values (`speed`, `color`, `effect`, `position`, `voice`, `blipStyle`) "
    + "for every `say` line in that scene. Keys omitted here fall back to engine defaults.",

  say:
    "**`say`** — Displays a line of text. Without `actor=` it is narration (no nameplate). "
    + "With `actor=` it is character dialogue. Accepts optional arguments: "
    + "`actor`, `portrait`, `speed`, `color`, `effect`, `voice`, `force`.",

  script:
    "**`script`** — Calls an HScript function registered with the engine immediately. "
    + "Execution continues to the next node without waiting. "
    + "The function may call `dialogueScreen.unfreeze()` to release a following `freeze`. "
    + "Example: `script openDoor`",

  freeze:
    "**`freeze`** — Halts dialogue playback entirely. Player confirm has no effect. "
    + "Resume by calling `DialogueScreen.unfreeze()` from external code (e.g. a script "
    + "function, an animation callback, a game event). "
    + "Typical pattern: `script startCutscene` then `freeze`.",

  voice_blip:
    "**`voice_blip`** — Changes the active blip sound and/or style mid-scene. "
    + "Accepts `sound=<asset>` (relative to `sfx/dialogue/`, or `\"\"` for silence) "
    + "and/or `style=<monophonic|polyphonic|solophonic>`. At least one argument required. "
    + "Example: `voice_blip sound=text style=polyphonic`",

  goto:
    "**`goto`** — Jumps immediately to another scene in the same file. "
    + "Execution of the current scene stops at this point.",

  if:
    "**`if`** — Evaluates a flag condition (`==` or `!=`) and runs the indented block "
    + "when the condition is true. An optional `else:` block runs when it is false. "
    + "Can appear standalone or after a `choice` `option` label.",

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
    
  // --- Enum value hovers ---
  top:
    "**`top`** — Places the dialogue box at the top of the screen.",
  bottom:
    "**`bottom`** — Places the dialogue box at the bottom of the screen.",
  center:
    "**`center`** — Places the dialogue box in the vertical centre of the screen.",
  
  monophonic:
    "**`monophonic`** — One `FlxSound` instance, stopped and restarted every tick. Only one blip at a time.",
  polyphonic:
    "**`polyphonic`** — Pool of `FlxSound` instances. Idle instance reused; new one created if all busy. Instances never interrupted; fast reveals layer naturally.",
  solophonic:
    "**`solophonic`** — One `FlxSound` instance, but it is **not** restarted. If the sound is already playing, the trigger is ignored. Best for longer, melodic blips.",
    
  shake:
    "**`shake`** — Text characters randomly jitter.",
  wave:
    "**`wave`** — Text characters bounce up and down in a sine wave.",
  flicker:
    "**`flicker`** — Text characters quickly flash in and out of visibility.",
  rainbow:
    "**`rainbow`** — Text characters cycle through the colour spectrum.",
  none:
    "**`none`** — Disables effects, resets text colour, or clears the portrait depending on the context.",
};

// ---------------------------------------------------------------------------
// Type rules
// ---------------------------------------------------------------------------

/** Args that must receive a bare numeric literal (integer or float). */
const NUMERIC_ARGS = new Set(["speed", "delay"]);

/** Args that must receive a quoted string or bare identifier (not a bare number). */
const STRING_ARGS = new Set(["actor", "portrait", "voice", "sound"]);

/** Boolean args that must receive `true` or `false`. */
const BOOLEAN_ARGS = new Set(["force"]);

/** `effect` valid values. */
const EFFECT_VALUES = new Set(["none", "shake", "wave", "flicker", "rainbow"]);

/** `position` valid values. */
const POSITION_VALUES = new Set(["top", "bottom", "center"]);

/** `blipStyle` and `style` valid values. */
const BLIPSTYLE_VALUES = new Set(["monophonic", "polyphonic", "solophonic"]);

// Regex to lex named arguments anywhere on a line: key = value
// Captures: [1] key  [2] value token (quoted string, hex color, or bare word/number)
// Note: `delay` is intentionally excluded — it only appears in inline overrides.
const ARG_RE =
  /\b(actor|portrait|speed|color|effect|voice|force|position|blipStyle|sound|style)\s*=\s*("(?:[^"\\]|\\.)*"|#[0-9A-Fa-f]{6}\b|\S+)/g;

// Inline-override block: {key=value ...}
const INLINE_BLOCK_RE = /\{([^}]*)\}/g;
// Key=value inside an inline block
const INLINE_ARG_RE = /\b(color|effect|speed|delay)\s*=\s*("(?:[^"\\]|\\.)*"|#[0-9A-Fa-f]{6}\b|\S+)/g;

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
    }

    // Check for reset tags ({key}) with no matching open tag on this line,
    // and for invalid bare tags like {delay} (which has no reset form).
    checkBareInlineTags(strippedText, lineIdx, diagnostics);
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

  // ----- Numeric args: speed, delay -----
  if (NUMERIC_ARGS.has(key)) {
    if (isQuoted) {
      return `'${key}' expects a number, not a quoted string (${context}).`;
    }
    if (isIdentifier) {
      return `'${key}' expects a number, not an identifier "${rawValue}" (${context}).`;
    }
    return null;
  }

  // ----- String args: actor, portrait, voice, sound -----
  if (STRING_ARGS.has(key)) {
    if (isNumber) {
      return `'${key}' expects a quoted string or identifier, not a number (${context}).`;
    }
    return null;
  }

  // ----- Boolean args: force -----
  if (BOOLEAN_ARGS.has(key)) {
    if (isQuoted) {
      return `'${key}' expects true or false, not a quoted string.`;
    }
    if (isNumber) {
      return `'${key}' expects true or false, not a number.`;
    }
    if (isIdentifier && rawValue !== "true" && rawValue !== "false") {
      return `'${key}' must be "true" or "false" — got "${rawValue}".`;
    }
    return null;
  }

  // ----- Enum: effect -----
  if (key === "effect") {
    if (isQuoted) {
      return `'effect' expects a bare keyword (none, shake, wave, flicker, rainbow), not a quoted string.`;
    }
    if (isNumber) {
      return `'effect' expects a keyword (none, shake, wave, flicker, rainbow), not a number.`;
    }
    if (isIdentifier && !EFFECT_VALUES.has(rawValue)) {
      return `'effect' must be one of: none, shake, wave, flicker, rainbow — got "${rawValue}".`;
    }
    return null;
  }

  // ----- Enum: position -----
  if (key === "position") {
    if (isQuoted) {
      return `'position' expects a bare keyword (top, bottom, center), not a quoted string.`;
    }
    if (isNumber) {
      return `'position' expects a keyword (top, bottom, center), not a number.`;
    }
    if (isIdentifier && !POSITION_VALUES.has(rawValue)) {
      return `'position' must be "top", "bottom", or "center" — got "${rawValue}".`;
    }
    return null;
  }

  // ----- Enum: blipStyle -----
  if (key === "blipStyle") {
    if (isQuoted) {
      return `'blipStyle' expects a bare keyword (monophonic, polyphonic, solophonic), not a quoted string.`;
    }
    if (isNumber) {
      return `'blipStyle' expects a keyword (monophonic, polyphonic, solophonic), not a number.`;
    }
    if (isIdentifier && !BLIPSTYLE_VALUES.has(rawValue)) {
      return `'blipStyle' must be "monophonic", "polyphonic", or "solophonic" — got "${rawValue}".`;
    }
    return null;
  }

  // ----- Enum: style (voice_blip) -----
  if (key === "style") {
    if (isQuoted) {
      return `'style' expects a bare keyword (monophonic, polyphonic, solophonic), not a quoted string.`;
    }
    if (isNumber) {
      return `'style' expects a keyword (monophonic, polyphonic, solophonic), not a number.`;
    }
    if (isIdentifier && !BLIPSTYLE_VALUES.has(rawValue)) {
      return `'style' must be "monophonic", "polyphonic", or "solophonic" — got "${rawValue}".`;
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
 * Scans the quoted string regions of a line for inline tags and validates them:
 *
 * - Reset tokens (`{key}` with no `=`) for `color`, `effect`, `speed` must have
 *   a preceding `{key=value}` open tag on the same line. If not, a Warning is
 *   emitted (the reset silently no-ops in the engine).
 *
 * - `{delay}` without `=` is always invalid — `delay` has no reset form.
 *   An Error is emitted.
 *
 * @param strippedLine  The full line text (comment-stripped, but with quotes intact).
 * @param lineIdx       0-based line index for diagnostic ranges.
 * @param diagnostics   Accumulator for new diagnostics.
 */
function checkBareInlineTags(
  strippedLine: string,
  lineIdx: number,
  diagnostics: vscode.Diagnostic[]
): void {
  // Walk through every quoted string region on the line and parse the
  // inline tags within it, tracking open/close state per key.
  let i = 0;
  while (i < strippedLine.length) {
    // Advance to the next opening quote.
    if (strippedLine[i] !== '"') { i++; continue; }

    // Scan through the quoted string, respecting \" escapes.
    i++; // consume opening quote
    // Track how many times each key has been "opened" without a matching reset.
    const openCount: Record<string, number> = { color: 0, effect: 0, speed: 0 };

    while (i < strippedLine.length) {
      const ch = strippedLine[i];

      if (ch === '\\') {
        i += 2; // skip escaped character
        continue;
      }
      if (ch === '"') {
        i++; // consume closing quote
        break;
      }
      if (ch === '{') {
        const close = strippedLine.indexOf('}', i + 1);
        if (close < 0) { i++; continue; } // unclosed brace — not our problem here

        const tagContent = strippedLine.slice(i + 1, close);
        const eqIdx = tagContent.indexOf('=');
        const tagKey = eqIdx >= 0 ? tagContent.slice(0, eqIdx).trim() : tagContent.trim();

        // --- delay has no reset form ---
        if (tagKey === 'delay') {
          if (eqIdx < 0) {
            // {delay} without = is invalid
            const tokenStart = i;
            const tokenEnd   = close + 1;
            const range = new vscode.Range(lineIdx, tokenStart, lineIdx, tokenEnd);
            const diag = new vscode.Diagnostic(
              range,
              `'{delay}' is not valid — 'delay' has no reset form. Use '{delay=<seconds>}' to pause the typewriter.`,
              vscode.DiagnosticSeverity.Error
            );
            diag.source = "oneshot-dlg";
            diagnostics.push(diag);
          }
          // {delay=value} is valid — nothing to check.
          i = close + 1;
          continue;
        }

        // --- color, effect, speed: track open/reset pairs ---
        if (tagKey === 'color' || tagKey === 'effect' || tagKey === 'speed') {
          if (eqIdx >= 0) {
            // {key=value} — open tag, increment counter.
            openCount[tagKey]++;
          } else {
            // {key} — reset tag.
            if (openCount[tagKey] === 0) {
              // No matching open tag preceded this reset on the same line.
              const tokenStart = i;
              const tokenEnd   = close + 1;
              const range = new vscode.Range(lineIdx, tokenStart, lineIdx, tokenEnd);
              const diag = new vscode.Diagnostic(
                range,
                `'{${tagKey}}' has no preceding '{${tagKey}=…}' open tag on this line — it resets nothing and will be ignored by the engine.`,
                vscode.DiagnosticSeverity.Warning
              );
              diag.source = "oneshot-dlg";
              diagnostics.push(diag);
            } else {
              // Consume one open — this reset is valid.
              openCount[tagKey]--;
            }
          }
        }

        i = close + 1;
        continue;
      }

      i++;
    }
  }
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