import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const csvPath = process.argv[2];
const jsonPath = process.argv[3];

const csv = readFileSync(csvPath, 'utf8');
const data = parse(csv, { columns: true, skip_empty_lines: true });

writeFileSync(jsonPath, JSON.stringify(data, null, 2));

console.log(`Converted ${data.length} records.`);
