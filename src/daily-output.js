import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const START_MARKER = '<!-- DAILY_CONTENT_START -->';
const END_MARKER = '<!-- DAILY_CONTENT_END -->';
const SECTION_NAMES = ['word', 'quote', 'history', 'birthday', 'photo', 'culture', 'miscellaneous'];

function isUrl(value) {
  return typeof value === 'string' && /^https:\/\//.test(value);
}

function link(label, url) {
  return isUrl(url) ? `[${label}](${url})` : label;
}

function unavailable() {
  return 'Unavailable today.';
}

function renderPhoto(photo) {
  if (photo?.status !== 'live' || !isUrl(photo.imageUrl)) return unavailable();
  return `![${photo.caption}](${photo.imageUrl})\n\n*${photo.caption}* — ${photo.creator}. ${link('Source', photo.sourceUrl)} · ${link(photo.license, photo.licenseUrl)}`;
}

function renderWord(word) {
  if (!word?.word) return unavailable();
  return `**${word.word}** — *${word.partOfSpeech}*\n\n${word.definition}\n\n${word.example}`;
}

function renderQuote(quote) {
  if (!quote?.quote) return unavailable();
  return `> ${quote.quote}\n\n— ${quote.author}, *${quote.source}*`;
}

function renderSourcedText(section) {
  return section?.text ? `${section.text}\n\n${link('Source', section.sourceUrl)}` : unavailable();
}

function renderBirthday(birthday) {
  if (!birthday?.name) return unavailable();
  return `**${birthday.name}** (${birthday.birthYear}) — ${birthday.knownFor}\n\n${link('Source', birthday.sourceUrl)}`;
}

function renderMiscellaneous(miscellaneous) {
  return miscellaneous?.fact ? `**${miscellaneous.category}:** ${miscellaneous.fact}` : unavailable();
}

export function renderDailySection(entry) {
  return [
    `## Today — ${entry.date}`,
    '',
    '### Photo',
    renderPhoto(entry.photo),
    '',
    '### Word',
    renderWord(entry.word),
    '',
    '### Quote',
    renderQuote(entry.quote),
    '',
    '### On This Day',
    renderSourcedText(entry.history),
    '',
    '### Born Today',
    renderBirthday(entry.birthday),
    '',
    '### Pop Culture',
    renderSourcedText(entry.culture),
    '',
    '### Miscellaneous',
    renderMiscellaneous(entry.miscellaneous),
  ].join('\n');
}

function replaceGeneratedSection(readme, section) {
  const start = readme.indexOf(START_MARKER);
  const end = readme.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start
    || readme.indexOf(START_MARKER, start + START_MARKER.length) !== -1
    || readme.indexOf(END_MARKER, end + END_MARKER.length) !== -1) {
    throw new Error('README DAILY_CONTENT markers are missing or malformed');
  }

  return `${readme.slice(0, start + START_MARKER.length)}\n\n${section}\n\n${readme.slice(end)}`;
}

async function writeIfChanged(path, content) {
  let existing = null;
  try {
    existing = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (existing !== content) {
    await writeFile(path, content);
    return true;
  }

  return false;
}

async function readLastRun(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

export async function writeDailyOutput(entry, {
  rootDirectory = process.cwd(),
  generatedAt = new Date().toISOString(),
} = {}) {
  const readmePath = join(rootDirectory, 'README.md');
  const archiveDirectory = join(rootDirectory, 'archive');
  const dataDirectory = join(rootDirectory, 'data');
  const statusPath = join(dataDirectory, 'last-run.json');
  const section = renderDailySection(entry);
  const readme = await readFile(readmePath, 'utf8');
  const existingStatus = await readLastRun(statusPath);
  const status = {
    date: entry.date,
    generatedAt: existingStatus?.date === entry.date ? existingStatus.generatedAt : generatedAt,
    sections: Object.fromEntries(SECTION_NAMES.map((name) => [name, { status: entry[name].status }])),
  };

  await Promise.all([mkdir(archiveDirectory, { recursive: true }), mkdir(dataDirectory, { recursive: true })]);
  const [readmeChanged, archiveChanged, statusChanged] = await Promise.all([
    writeIfChanged(readmePath, replaceGeneratedSection(readme, section)),
    writeIfChanged(join(archiveDirectory, `${entry.date}.md`), `# Daily entry — ${entry.date}\n\n${section}\n`),
    writeIfChanged(statusPath, `${JSON.stringify(status, null, 2)}\n`),
  ]);

  return { readmeChanged, archiveChanged, statusChanged, status };
}
