// The key check. It fails when architecture/keys.json and the two key tables of
// architecture/web-app.md disagree, so that the data and the prose never drift apart. It also fails
// when DEFAULT_KEYS of the behaviour module keys.ts and the entries of keys.json with an id disagree,
// and when RICH_TEXT_KEYS of the module rich-text.ts and the entries whose id starts with "rich-text."
// disagree.
//
//   node scripts/keys.mjs   exit 1 on a difference; the last line counts the entries that match
//
// The tables are "### Shared keys" and "### Keys that the components own". Each row gives one entry
// for each key of its first cell: "J or Down, K or Up" gives J, Down, K and Up. A cell with ", then "
// is one sequence, and "The arrow keys" gives Up, Down, Left and Right. A row of the shared table has
// the owner "shared". A row of the components table names its owner before the first ": " of its
// second cell, and its action after it. Backticks drop out of every cell.
//
// An entry may also hold an id: the KeyAction of the behaviour module that the key runs, such as
// "next-row". The tables have no id, so the id takes no part in the comparison with web-app.md. For
// each action of DEFAULT_KEYS, the keys of the entries with its id are the keys of the action. An id
// "rich-text.<command>" names a RichTextCommand of the rich text field instead, and the keys of the
// entries with that id are the keys of the command in RICH_TEXT_KEYS; a command with no key has no
// entry. The script reads DEFAULT_KEYS from the source of keys.ts and RICH_TEXT_KEYS from the source of
// rich-text.ts, one line for each action or command, because the root check runs before the install of
// the preview and has no TypeScript.
import { pathToFileURL } from 'node:url';
import { readSource } from './lib/design.mjs';

export const PROSE = 'architecture/web-app.md';
export const DATA = 'architecture/keys.json';
export const DEFAULTS = 'preview/src/lib/stack/behaviour/keys.ts';
export const RICH_TEXT = 'preview/src/lib/stack/rich-text.ts';
/** The prefix of the id of an entry that names a command of the rich text field. */
export const RICH_TEXT_ID = 'rich-text.';
export const FIELDS = ['key', 'action', 'scope', 'owner'];
const TABLES = [
  { heading: 'Shared keys', owner: 'shared' },
  { heading: 'Keys that the components own', owner: null },
];
const ARROWS = ['Up', 'Down', 'Left', 'Right'];

const plain = (cell) => cell.replaceAll('`', '').trim();

/** The body rows of the first table under "### <heading>", each with its cells and its 1-based line. */
export function tableRows(text, heading) {
  const lines = text.split('\n');
  let fence = null;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const f = /^\s*(```+|~~~+)/.exec(lines[i]);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      continue;
    }
    if (!fence && lines[i].trim() === `### ${heading}`) {
      start = i;
      break;
    }
  }
  if (start < 0) throw new Error(`${PROSE} has no "### ${heading}" heading.`);
  let i = start + 1;
  while (i < lines.length && !lines[i].startsWith('|')) {
    if (/^#{2,3} /.test(lines[i])) throw new Error(`${PROSE}: "### ${heading}" has no table.`);
    i++;
  }
  const rows = [];
  for (let n = 0; i < lines.length && lines[i].startsWith('|'); i++, n++) {
    if (n < 2) continue; // the header row and the |---| row
    rows.push({ cells: lines[i].slice(1, -1).split('|').map((c) => c.trim()), line: i + 1 });
  }
  return rows;
}

/** The keys of one key cell. */
export function splitKeys(cell) {
  const c = plain(cell);
  if (c.includes(', then ')) return [c];
  if (c === 'The arrow keys') return ARROWS;
  return c.split(/, | or /).map((k) => k.trim()).filter(Boolean);
}

/** The entries that the two tables of web-app.md give, each with the line of its row. */
export function tableEntries(text) {
  const out = [];
  for (const t of TABLES) {
    for (const { cells, line } of tableRows(text, t.heading)) {
      if (cells.length !== 3) throw new Error(`${PROSE}:${line}: a row of "### ${t.heading}" has ${cells.length} cells, not 3.`);
      let [keys, action, scope] = cells.map(plain);
      let owner = t.owner;
      if (!owner) {
        const at = action.indexOf(': ');
        if (at < 0) throw new Error(`${PROSE}:${line}: the second cell names the owner, then ": ", then the use.`);
        owner = action.slice(0, at);
        action = action.slice(at + 2);
      }
      for (const key of splitKeys(keys)) out.push({ key, action, scope, owner, line });
    }
  }
  return out;
}

/** Throws unless the data is an array of objects that hold the four fields and an optional id, each a string. */
export function validate(data) {
  if (!Array.isArray(data)) throw new Error(`${DATA} holds one array of entries.`);
  data.forEach((e, i) => {
    const keys = e && typeof e === 'object' ? Object.keys(e).filter((k) => k !== 'id') : [];
    const fields = keys.length === FIELDS.length && FIELDS.every((f) => typeof e[f] === 'string' && e[f].trim());
    if (!fields || ('id' in e && !(typeof e.id === 'string' && e.id.trim()))) {
      throw new Error(`${DATA}: entry ${i + 1} holds exactly the fields ${FIELDS.join(', ')} and an optional id, each a string that is not empty.`);
    }
  });
}

/** DEFAULT_KEYS of the source of keys.ts, or the object `name` of the source `file`: each action with its keys, from the lines up to the closing "})". */
export function defaultKeys(source, name = 'DEFAULT_KEYS', file = DEFAULTS) {
  const lines = source.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^export const ${name}\\b.*\\{\\s*$`).test(l));
  if (start < 0) throw new Error(`${file} has no line that starts with "export const ${name}" and ends with "{".`);
  // A string of a key, in single or double quotes, can hold "]" and an escaped character, such as 'Cmd+\\'.
  const STRING = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
  const out = {};
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*\}\)?;?\s*$/.test(lines[i])) return out;
    const m = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:\s*\[((?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^\]'"])*)\]\s*,?\s*$/.exec(lines[i]);
    const rest = m ? m[4].replace(STRING, '').replace(/[\s,]/g, '') : '';
    if (!m || rest) throw new Error(`${file}:${i + 1}: a line of ${name} holds one action and the strings of its keys, such as "undo: ['Cmd+Z'],".`);
    out[m[1] ?? m[2] ?? m[3]] = [...m[4].matchAll(STRING)].map((k) => (k[1] ?? k[2]).replace(/\\(.)/g, '$1'));
  }
  throw new Error(`${file}: ${name} has no closing line "})" or "}".`);
}

/**
 * The differences between DEFAULT_KEYS and the keys of the entries of the data with an id, and between
 * RICH_TEXT_KEYS and the keys of the entries whose id starts with "rich-text.". With no richText, the
 * entries of the rich text field take no part.
 */
export function compareDefaults(defaults, data, richText = null) {
  const problems = [];
  const sets = [
    { label: 'DEFAULT_KEYS', file: DEFAULTS, prefix: '', defaults, byId: new Map(Object.keys(defaults).map((a) => [a, []])) },
    ...(richText ? [{ label: 'RICH_TEXT_KEYS', file: RICH_TEXT, prefix: RICH_TEXT_ID, defaults: richText, byId: new Map(Object.keys(richText).map((a) => [a, []])) }] : []),
  ];
  data.forEach((e, i) => {
    if (!('id' in e)) return;
    const rich = e.id.startsWith(RICH_TEXT_ID);
    if (rich && !richText) return;
    const set = sets.find((t) => t.prefix === (rich ? RICH_TEXT_ID : ''));
    const action = e.id.slice(set.prefix.length);
    if (set.byId.has(action)) set.byId.get(action).push(e.key);
    else problems.push(`${DATA}: entry ${i + 1} ${name(e)} has the id "${e.id}", and ${set.label} of ${set.file} has no such ${rich ? 'command' : 'action'}`);
  });
  for (const set of sets) {
    for (const [action, keys] of set.byId) {
      const want = [...set.defaults[action]].sort().join(', ') || 'no key';
      const have = [...keys].sort().join(', ') || 'no key';
      if (want !== have) problems.push(`${set.file}: ${set.label} gives "${action}" the keys ${want}, and the entries of ${DATA} with the id "${set.prefix}${action}" give ${have}`);
    }
  }
  return problems;
}

const entryKey = (e) => JSON.stringify(FIELDS.map((f) => e[f]));
const name = (e) => `"${e.key}" (${e.owner}, ${e.scope})`;

/** The differences between the entries of the tables and the entries of the data. */
export function compare(table, data) {
  const problems = [];
  const want = new Map(table.map((e) => [entryKey(e), e]));
  const have = new Map();
  data.forEach((e, i) => {
    if (have.has(entryKey(e))) problems.push(`${DATA}: entry ${i + 1} ${name(e)} is a copy of entry ${have.get(entryKey(e)) + 1}`);
    else have.set(entryKey(e), i);
  });
  for (const [k, e] of want) if (!have.has(k)) problems.push(`${PROSE}:${e.line}: ${name(e)} is in the table and not in ${DATA}, or its action differs`);
  for (const [k, i] of have) if (!want.has(k)) problems.push(`${DATA}: entry ${i + 1} ${name(data[i])} is not in the tables of ${PROSE}, or its action differs`);
  return problems;
}

function main() {
  const text = readSource(PROSE);
  const json = readSource(DATA);
  const source = readSource(DEFAULTS);
  const richSource = readSource(RICH_TEXT);
  if (text === null || json === null || source === null || richSource === null) throw new Error(`${PROSE}, ${DATA}, ${DEFAULTS} or ${RICH_TEXT} not found. Run this from the root of the repository.`);
  let data;
  try {
    data = JSON.parse(json);
  } catch (e) {
    throw new Error(`${DATA} is not valid JSON: ${e.message}`);
  }
  validate(data);
  const defaults = defaultKeys(source);
  const richText = defaultKeys(richSource, 'RICH_TEXT_KEYS', RICH_TEXT);
  const problems = [...compare(tableEntries(text), data), ...compareDefaults(defaults, data, richText)];
  for (const p of problems) console.error(`keys: ${p}`);
  console.log(
    problems.length
      ? `keys: ${problems.length} ${problems.length === 1 ? 'difference' : 'differences'}. Change the table, ${DATA}, DEFAULT_KEYS of ${DEFAULTS} and RICH_TEXT_KEYS of ${RICH_TEXT} in the same commit.`
      : `keys: the ${data.length} entries of ${DATA} match the two tables of ${PROSE}, the ${Object.keys(defaults).length} actions of DEFAULT_KEYS in ${DEFAULTS} match their ids, and the ${Object.keys(richText).length} commands of RICH_TEXT_KEYS in ${RICH_TEXT} match theirs`,
  );
  return problems.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (e) {
    console.error(`keys: ${e.message}`);
    process.exitCode = 1;
  }
}
