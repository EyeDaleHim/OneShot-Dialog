import * as vscode from "vscode";

// ---------------------------------------------------------------------------
// Hover documentation
// ---------------------------------------------------------------------------

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
    "**`side`** — Sets the default portrait side. "
    + "Accepted values: `left` or `right`. Defaults to `left`.",

  position:
    "**`position`** — Controls the vertical placement of the dialogue box. "
    + "Accepted values: `top`, `bottom`, `center`. Defaults to `bottom`. "
    + "Set in the scene `params` block; not available as a per-line override.",

  voices:
    "**`voices`** — Comma-separated pool of voice-blip asset IDs played while text scrolls. "
    + "Relative to `sfx/dialogue/`. Use `\"\"` (empty string) to silence blips. "
    + "Defaults to `\"text\"`. Can be overridden on individual `say` lines.",

  blipStyle:
    "**`blipStyle`** — Controls how voice blips are played. "
    + "`monophonic` — One sound instance, stopped and restarted every tick. "
    + "`polyphonic` — Pool of sound instances; allows layering. "
    + "`solophonic` — One sound instance, not restarted; ignored if already playing. "
    + "Defaults to `monophonic`. Set in the scene `params` block.",

  blipModulo:
    "**`blipModulo`** — Fire a blip every N non-whitespace characters. "
    + "Expects an integer ≥ 1. Defaults to `1`.",

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
    + "Use `portrait=none` to explicitly clear the portrait. Can also be "
    + "changed mid-sentence using `{portrait=id}` or cleared with `{portrait}`.",

  force:
    "**`force`** — When `true`, the dialogue line auto-advances to the next node "
    + "when the typewriter finishes, without requiring player input. "
    + "Accepts `true` or `false`. Only valid on `say` lines.",

  // --- voice_blip arguments ---
  sounds:
    "**`sounds`** — Comma-separated pool of voice-blip asset IDs for `voice_blip`. "
    + "Relative to `sfx/dialogue/`. Use `\"\"` to silence blips from this point onward. "
    + "Example: `voice_blip sounds=\"beep1,beep2\"`",

  style:
    "**`style`** — Playback style for voice blips in a `voice_blip` command. "
    + "Accepted values: `monophonic`, `polyphonic`, `solophonic`.",

  modulo:
    "**`modulo`** — Fire a blip every N non-whitespace characters. "
    + "Expects an integer ≥ 1.",

  // --- Inline override keys ---
  delay:
    "**`delay`** — Pauses the typewriter for the specified number of seconds. "
    + "Accepts a positive float (e.g. `{delay=1.5}`). One-shot — there is no reset form. "
    + "Only valid inside inline overrides within dialogue text.",

  input:
    "**`input`** — Inserts an input gate. Typewriter pauses here; player must confirm to continue. "
    + "Accepted values: `skip_until_tag` or `skip_all`.",

  // --- Block / flow-control keywords ---
  scene:
    "**`scene`** — Declares a named scene block. The engine begins at the first scene "
    + "in the file unless directed elsewhere. Scene IDs may contain letters, digits, "
    + "and underscores.",

  params:
    "**`params`** — Optional block at the very top of a scene that sets default "
    + "presentation values (`speed`, `color`, `effect`, `position`, `voices`, `blipStyle`, `blipModulo`, `side`) "
    + "for every `say` line in that scene. Keys omitted here fall back to engine defaults.",

  say:
    "**`say`** — Displays a line of text. Without `actor=` it is narration (no nameplate). "
    + "With `actor=` it is character dialogue. Accepts optional arguments: "
    + "`actor`, `portrait`, `side`, `speed`, `color`, `effect`, `voices`, `force`.",

  script:
    "**`script`** — Calls an HScript function registered with the engine immediately. "
    + "Execution continues to the next node without waiting. "
    + "The function may call `dialogueScreen.unfreeze()` to release a following `freeze`.",

  freeze:
    "**`freeze`** — Halts dialogue playback entirely. Player confirm has no effect. "
    + "Resume by calling `DialogueScreen.unfreeze()` from external code.",

  voice_blip:
    "**`voice_blip`** — Changes the active blip sound pool, style, or modulo mid-scene. "
    + "Example: `voice_blip sounds=\"text\" style=polyphonic modulo=3`",

  goto:
    "**`goto`** — Jumps immediately to another scene in the same file. "
    + "Execution of the current scene stops at this point.",

  if:
    "**`if`** — Evaluates a flag condition (`==` or `!=`) and runs the indented block "
    + "when the condition is true. An optional `else:` block runs when it is false.",

  else:
    "**`else`** — Optional branch of an `if` block.",

  choice:
    "**`choice`** — Presents the player with a set of labelled options. "
    + "Each `option` has a double-quoted label and an indented body.",

  option:
    "**`option`** — A single selectable entry inside a `choice` block. "
    + "Takes a double-quoted label and an optional `if flag == value` condition.",
    
  // --- Enum value hovers ---
  top: "**`top`** — Places the dialogue box at the top of the screen.",
  bottom: "**`bottom`** — Places the dialogue box at the bottom of the screen.",
  center: "**`center`** — Places the dialogue box in the vertical centre of the screen.",
  left: "**`left`** — Places the character portrait on the left side.",
  right: "**`right`** — Places the character portrait on the right side.",
  
  monophonic: "**`monophonic`** — One `FlxSound` instance, stopped and restarted every tick. Only one blip at a time.",
  polyphonic: "**`polyphonic`** — Pool of `FlxSound` instances. Idle instance reused; new one created if all busy. Instances never interrupted.",
  solophonic: "**`solophonic`** — One `FlxSound` instance, but it is **not** restarted. If the sound is already playing, the trigger is ignored.",
    
  shake: "**`shake`** — Text characters randomly jitter.",
  wave: "**`wave`** — Text characters bounce up and down in a sine wave.",
  flicker: "**`flicker`** — Text characters quickly flash in and out of visibility.",
  rainbow: "**`rainbow`** — Text characters cycle through the colour spectrum.",
  none: "**`none`** — Disables effects, resets text colour, or clears the portrait depending on the context.",

  skip_until_tag: "**`skip_until_tag`** — Input gate. Skip (confirm during reveal) snaps to this gate position and pauses.",
  skip_all: "**`skip_all`** — Input gate. Skip (confirm during reveal) snaps to end of text, ignoring any remaining `skip_until_tag` gates."
};

// ---------------------------------------------------------------------------
// Type rules
// ---------------------------------------------------------------------------

const NUMERIC_ARGS = new Set(["speed", "delay", "blipModulo", "modulo"]);
const STRING_ARGS = new Set(["actor", "portrait", "voices", "sounds"]);
const BOOLEAN_ARGS = new Set(["force"]);
const EFFECT_VALUES = new Set(["none", "shake", "wave", "flicker", "rainbow"]);
const POSITION_VALUES = new Set(["top", "bottom", "center"]);
const BLIPSTYLE_VALUES = new Set(["monophonic", "polyphonic", "solophonic"]);
const SIDE_VALUES = new Set(["left", "right"]);
const INPUT_VALUES = new Set(["skip_until_tag", "skip_all"]);

// Regex to lex named arguments anywhere on a line: key = value
const ARG_RE =
  /\b(actor|portrait|speed|color|effect|voices|force|position|blipStyle|sounds|style|side|blipModulo|modulo)\s*=\s*("(?:[^"\\]|\\.)*"|#[0-9A-Fa-f]{6}\b|\S+)/g;

// Inline-override block: {key=value ...}
const INLINE_BLOCK_RE = /\{([^}]*)\}/g;
// Key=value inside an inline block
const INLINE_ARG_RE = /\b(color|effect|speed|delay|portrait|input)\s*=\s*("(?:[^"\\]|\\.)*"|#[0-9A-Fa-f]{6}\b|\S+)/g;

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

// ---------------------------------------------------------------------------
// Diagnostic collection
// ---------------------------------------------------------------------------
let diagnosticCollection: vscode.DiagnosticCollection;

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection("oneshot-dlg");
  context.subscriptions.push(diagnosticCollection);

  for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === "dlg") validateDocument(doc);
  }

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

    vscode.languages.registerHoverProvider({ language: "dlg" }, {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
        if (!range) return undefined;
        const word = document.getText(range);
        const doc = HOVER_DOCS[word];
        if (!doc) return undefined;
        return new vscode.Hover(new vscode.MarkdownString(doc), range);
      },
    }),

    // Auto-completion Provider
    vscode.languages.registerCompletionItemProvider(
      { language: "dlg" },
      {
        provideCompletionItems(document, position) {
          const lineText = document.lineAt(position).text;
          const linePrefix = lineText.substring(0, position.character);
          
          const completions: vscode.CompletionItem[] = [];

          // Helper to create simple property completions
          const addKeys = (keys: string[]) => {
            for (const k of keys) completions.push(new vscode.CompletionItem(k, vscode.CompletionItemKind.Property));
          };

          // Helper to create enum value completions
          const addValues = (vals: Set<string> | string[]) => {
            for (const v of vals) completions.push(new vscode.CompletionItem(v, vscode.CompletionItemKind.Value));
          };

          // 1. Are we inside an inline block? {...}
          const inlineMatch = linePrefix.match(/\{([^}]*)$/);
          if (inlineMatch) {
            const inlineContent = inlineMatch[1];
            const enumMatch = inlineContent.match(/\b(effect|input|color)\s*=\s*$/);
            if (enumMatch) {
              if (enumMatch[1] === "effect") addValues(EFFECT_VALUES);
              if (enumMatch[1] === "input") addValues(INPUT_VALUES);
              if (enumMatch[1] === "color") addValues(["none", "#"]);
              return completions;
            }
            addKeys(["color", "effect", "speed", "delay", "portrait", "input"]);
            return completions;
          }

          // 2. Not in inline block. Check if typed `key=`
          const valueMatch = linePrefix.match(/\b(effect|position|blipStyle|style|side|force)\s*=\s*$/);
          if (valueMatch) {
            const key = valueMatch[1];
            if (key === "effect") addValues(EFFECT_VALUES);
            else if (key === "position") addValues(POSITION_VALUES);
            else if (key === "blipStyle" || key === "style") addValues(BLIPSTYLE_VALUES);
            else if (key === "side") addValues(SIDE_VALUES);
            else if (key === "force") addValues(["true", "false"]);
            return completions;
          }

          // 3. Are we on a say line?
          if (/^\s*say\b/.test(linePrefix)) {
            addKeys(["actor", "portrait", "side", "speed", "color", "effect", "voices", "force"]);
            return completions;
          }

          // 4. Are we on a voice_blip line?
          if (/^\s*voice_blip\b/.test(linePrefix)) {
            addKeys(["sounds", "style", "modulo"]);
            return completions;
          }

          // 5. Are we inside a params block?
          // Simplistic check: indented and nowhere else matched.
          if (/^\s+/.test(linePrefix)) {
            // Provide all possible param keys loosely if they type a space or start a word
            addKeys(["speed", "color", "effect", "position", "voices", "blipStyle", "blipModulo", "side"]);
            return completions;
          }

          return undefined;
        }
      },
      ' ', '{', '='
    )
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

    const trimmed = text.trimStart();
    if (trimmed.startsWith("#") || trimmed === "") continue;

    const strippedText = stripComment(text);

    checkNamedArgs(strippedText, lineIdx, 0, diagnostics, false);

    INLINE_BLOCK_RE.lastIndex = 0;
    let blockMatch: RegExpExecArray | null;
    while ((blockMatch = INLINE_BLOCK_RE.exec(strippedText)) !== null) {
      const blockContent = blockMatch[1];
      const blockOffset = blockMatch.index + 1;
      checkNamedArgs(blockContent, lineIdx, blockOffset, diagnostics, true);
    }

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
      const diag = new vscode.Diagnostic(range, err, vscode.DiagnosticSeverity.Error);
      diag.source = "oneshot-dlg";
      diagnostics.push(diag);
    }
  }
}

// ---------------------------------------------------------------------------
// Single arg-value checker
// ---------------------------------------------------------------------------
function checkArgValue(
  key: string,
  rawValue: string,
  isInline: boolean
): string | null {
  const isQuoted = rawValue.startsWith('"');
  const isHex = HEX_COLOR_RE.test(rawValue);
  const isNumber = !isQuoted && /^\d+(\.\d+)?$/.test(rawValue);
  // Identifiers may now include slashes (e.g. for portraits: "niko/happy")
  const isIdentifier = !isQuoted && !isHex && /^[A-Za-z_][A-Za-z0-9_/-]*$/.test(rawValue);

  const context = isInline ? "inline override" : "argument";

  if (NUMERIC_ARGS.has(key)) {
    if (isQuoted) return `'${key}' expects a number, not a quoted string (${context}).`;
    if (isIdentifier) return `'${key}' expects a number, not an identifier "${rawValue}" (${context}).`;
    return null;
  }

  if (STRING_ARGS.has(key)) {
    if (isNumber) return `'${key}' expects a quoted string or identifier, not a number (${context}).`;
    return null;
  }

  if (BOOLEAN_ARGS.has(key)) {
    if (isQuoted) return `'${key}' expects true or false, not a quoted string.`;
    if (isNumber) return `'${key}' expects true or false, not a number.`;
    if (isIdentifier && rawValue !== "true" && rawValue !== "false") {
      return `'${key}' must be "true" or "false" — got "${rawValue}".`;
    }
    return null;
  }

  if (key === "effect") {
    if (isQuoted) return `'effect' expects a bare keyword (none, shake, wave, flicker, rainbow), not a quoted string.`;
    if (isNumber) return `'effect' expects a keyword, not a number.`;
    if (isIdentifier && !EFFECT_VALUES.has(rawValue)) return `'effect' must be one of: none, shake, wave, flicker, rainbow — got "${rawValue}".`;
    return null;
  }

  if (key === "position") {
    if (isQuoted) return `'position' expects a bare keyword (top, bottom, center), not a quoted string.`;
    if (isNumber) return `'position' expects a keyword, not a number.`;
    if (isIdentifier && !POSITION_VALUES.has(rawValue)) return `'position' must be "top", "bottom", or "center" — got "${rawValue}".`;
    return null;
  }

  if (key === "side") {
    if (isQuoted) return `'side' expects a bare keyword (left, right), not a quoted string.`;
    if (isNumber) return `'side' expects a keyword, not a number.`;
    if (isIdentifier && !SIDE_VALUES.has(rawValue)) return `'side' must be "left" or "right" — got "${rawValue}".`;
    return null;
  }

  if (key === "input") {
    if (isQuoted) return `'input' expects a bare keyword (skip_until_tag, skip_all), not a quoted string.`;
    if (isNumber) return `'input' expects a keyword, not a number.`;
    if (isIdentifier && !INPUT_VALUES.has(rawValue)) return `'input' must be "skip_until_tag" or "skip_all" — got "${rawValue}".`;
    return null;
  }

  if (key === "blipStyle" || key === "style") {
    if (isQuoted) return `'${key}' expects a bare keyword (monophonic, polyphonic, solophonic), not a quoted string.`;
    if (isNumber) return `'${key}' expects a keyword, not a number.`;
    if (isIdentifier && !BLIPSTYLE_VALUES.has(rawValue)) return `'${key}' must be "monophonic", "polyphonic", or "solophonic" — got "${rawValue}".`;
    return null;
  }

  if (key === "color") {
    if (isHex || rawValue === "none") return null;
    if (isQuoted) return `'color' expects a hex literal (#RRGGBB) or "none", not a quoted string.`;
    if (isNumber) return `'color' expects a hex literal (#RRGGBB) or "none", not a number.`;
    if (isIdentifier) return `'color' expects a hex literal (#RRGGBB) or "none" — got "${rawValue}".`;
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Bare inline-tag checker
// ---------------------------------------------------------------------------
function checkBareInlineTags(
  strippedLine: string,
  lineIdx: number,
  diagnostics: vscode.Diagnostic[]
): void {
  let i = 0;
  while (i < strippedLine.length) {
    if (strippedLine[i] !== '"') { i++; continue; }

    i++; 
    const openCount: Record<string, number> = { color: 0, effect: 0, speed: 0 };

    while (i < strippedLine.length) {
      const ch = strippedLine[i];

      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '"') {
        i++;
        break;
      }
      if (ch === '{') {
        const close = strippedLine.indexOf('}', i + 1);
        if (close < 0) { i++; continue; }

        const tagContent = strippedLine.slice(i + 1, close);
        const eqIdx = tagContent.indexOf('=');
        const tagKey = eqIdx >= 0 ? tagContent.slice(0, eqIdx).trim() : tagContent.trim();

        if (tagKey === 'delay' || tagKey === 'input') {
          if (eqIdx < 0) {
            const tokenStart = i;
            const tokenEnd   = close + 1;
            const range = new vscode.Range(lineIdx, tokenStart, lineIdx, tokenEnd);
            const diag = new vscode.Diagnostic(
              range,
              `'{${tagKey}}' is not valid — '${tagKey}' has no reset form.`,
              vscode.DiagnosticSeverity.Error
            );
            diag.source = "oneshot-dlg";
            diagnostics.push(diag);
          }
          i = close + 1;
          continue;
        }

        if (tagKey === 'color' || tagKey === 'effect' || tagKey === 'speed') {
          if (eqIdx >= 0) {
            openCount[tagKey]++;
          } else {
            if (openCount[tagKey] === 0) {
              const tokenStart = i;
              const tokenEnd   = close + 1;
              const range = new vscode.Range(lineIdx, tokenStart, lineIdx, tokenEnd);
              const diag = new vscode.Diagnostic(
                range,
                `'{${tagKey}}' has no preceding '{${tagKey}=…}' open tag on this line — it resets nothing and will be ignored.`,
                vscode.DiagnosticSeverity.Warning
              );
              diag.source = "oneshot-dlg";
              diagnostics.push(diag);
            } else {
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
// Strip trailing line comment
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
      const ahead = text.slice(i + 1, i + 7);
      if (/^[0-9A-Fa-f]{6}\b/.test(ahead)) continue;
      return text.slice(0, i);
    }
  }
  return text;
}