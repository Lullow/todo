import { promises as fs } from 'node:fs';
import * as path from 'node:path';

/**
 * Tre lägen, inte två.
 *
 * `doing` finns för agentens skull. När Claude plockar upp en uppgift mitt i en
 * session vill man se det i panelen utan att uppgiften redan räknas som klar.
 * Panelen sätter aldrig `doing` själv — den läser det bara.
 */
export type Status = 'open' | 'doing' | 'done';

export interface Todo {
  id: string;
  status: Status;
  created: string;
  title: string;
  detail: string | null;
  path: string;
}

export function todosDir(root: string): string {
  return path.join(root, '.claude', 'todos');
}

/**
 * Datum i användarens egen tidszon, inte UTC.
 *
 * toISOString() ger UTC-datumet, som ligger fel större delen av kvällen för den
 * som sitter öster om Greenwich: en uppgift skapad 00:30 i Stockholm får
 * gårdagens datum, och sorteringen hamnar fel.
 */
function isoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today(): string {
  return isoDate(new Date());
}

interface Frontmatter {
  fields: Record<string, string>;
  body: string;
}

/**
 * Läser `nyckel: värde` och inget annat.
 *
 * Formatet ägs av den här filen och har tre fält. En YAML-parser vore mer kod
 * att underhålla än resten av tillägget tillsammans.
 */
function parseFrontmatter(raw: string): Frontmatter {
  if (!raw.startsWith('---')) return { fields: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { fields: {}, body: raw };

  const fields: Record<string, string> = {};
  for (const line of raw.slice(4, end).split('\n')) {
    const pair = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (pair?.[1]) fields[pair[1]] = (pair[2] ?? '').trim();
  }
  return { fields, body: raw.slice(end + 4).replace(/^\n+/, '') };
}

/** Okänt eller saknat värde betyder öppen — en uppgift försvinner inte för ett stavfel. */
function toStatus(value: string): Status {
  return value === 'done' || value === 'doing' ? value : 'open';
}

/**
 * Rubriken är brödtextens första rad, inte ett eget fält.
 *
 * Med både `title:` och en brödtext hamnar de förr eller senare i konflikt, och
 * då vet varken du eller agenten vilken som gäller. En uppgift *är* sin rubrik;
 * resten av texten är detaljer man kan strunta i.
 */
function split(body: string): { title: string; detail: string | null } {
  const lines = body.split('\n');
  const first = lines.findIndex((line) => line.trim() !== '');
  if (first === -1) return { title: '', detail: null };
  const rest = lines.slice(first + 1).join('\n').trim();
  return { title: (lines[first] ?? '').trim(), detail: rest === '' ? null : rest };
}

async function readTodo(file: string): Promise<Todo | null> {
  const raw = await fs.readFile(file, 'utf8');
  const { fields, body } = parseFrontmatter(raw);
  const { title, detail } = split(body);
  if (title === '') return null;

  return {
    id: fields['id'] || path.basename(file, '.md'),
    status: toStatus(fields['status'] ?? ''),
    created: fields['created'] ?? '',
    title,
    detail,
    path: file,
  };
}

export async function readTodos(root: string): Promise<Todo[]> {
  const dir = todosDir(root);
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }

  const todos: Todo[] = [];
  for (const name of names) {
    if (!name.endsWith('.md')) continue;
    try {
      const todo = await readTodo(path.join(dir, name));
      if (todo) todos.push(todo);
    } catch {
      // En trasig fil ska inte tömma hela panelen.
    }
  }

  // Äldst först: det som legat länge ska ligga överst och skava.
  return todos.sort((a, b) => a.created.localeCompare(b.created) || a.id.localeCompare(b.id));
}

/**
 * Skriver om `status:` och lämnar resten av filen orörd.
 *
 * Du ska kunna redigera en uppgift för hand — eller låta agenten göra det —
 * utan att en avbockning i panelen skriver över texten.
 */
export async function setStatus(todo: Todo, status: Status): Promise<void> {
  const raw = await fs.readFile(todo.path, 'utf8');

  let updated: string;
  if (/^status:.*$/m.test(raw)) {
    updated = raw.replace(/^status:.*$/m, `status: ${status}`);
  } else if (raw.startsWith('---\n')) {
    // Frontmatter finns men saknar fältet. Lägg till det överst.
    updated = raw.replace(/^---\n/, `---\nstatus: ${status}\n`);
  } else {
    // Helt handskriven fil utan frontmatter. Ge den en, behåll texten.
    updated = `---\nstatus: ${status}\ncreated: ${today()}\n---\n\n${raw.replace(/^\n+/, '')}`;
  }

  await fs.writeFile(todo.path, updated, 'utf8');
}

/** å/ä/ö skrivs av som a/a/o, så filnamnen går att skriva i en terminal. */
const TRANSLIT: Record<string, string> = { 'å': 'a', 'ä': 'a', 'ö': 'o', 'é': 'e', 'ü': 'u' };

function slug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[åäöéü]/g, (ch) => TRANSLIT[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60)
    .replace(/^-+|-+$/g, '');
  return base === '' ? 'uppgift' : base;
}

/** Skapar en ny uppgift och returnerar sökvägen till filen. */
export async function create(root: string, title: string): Promise<string> {
  const dir = todosDir(root);
  await fs.mkdir(dir, { recursive: true });

  const base = slug(title);
  let id = base;
  // Två uppgifter med samma rubrik ska inte skriva över varandra.
  for (let n = 2; ; n++) {
    try {
      await fs.access(path.join(dir, `${id}.md`));
      id = `${base}-${n}`;
    } catch {
      break;
    }
  }

  const file = path.join(dir, `${id}.md`);
  await fs.writeFile(
    file,
    `---\nid: ${id}\nstatus: open\ncreated: ${today()}\n---\n\n${title.trim()}\n`,
    'utf8',
  );
  return file;
}
