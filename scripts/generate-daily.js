import { generateDailyEntry } from '../src/generate.js';
import { writeDailyOutput } from '../src/daily-output.js';

const [date] = process.argv.slice(2);
const entry = await generateDailyEntry({ date });
const output = await writeDailyOutput(entry);

console.log(JSON.stringify({ date: entry.date, ...output }, null, 2));
