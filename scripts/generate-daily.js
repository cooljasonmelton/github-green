import { generateDailyEntry } from '../src/generate.js';

const [date] = process.argv.slice(2);
const entry = await generateDailyEntry({ date });

console.log(JSON.stringify(entry, null, 2));
