import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'agent', '.env');
const raw = readFileSync(envPath, 'utf8');
const line = raw.split(/\r?\n/).find((l) => l.startsWith('OPENAI_API_KEY='));

if (!line) {
  console.log('OPENAI_API_KEY line: MISSING');
  process.exit(1);
}

const val = line.slice('OPENAI_API_KEY='.length);
const trimmed = val.trim();

console.log('Key diagnostics (secret not printed):');
console.log('  raw length:', val.length);
console.log('  trimmed length:', trimmed.length);
console.log('  starts with sk-:', trimmed.startsWith('sk-'));
console.log('  has quote chars:', /["']/.test(val));
console.log('  has outer whitespace:', val !== trimmed);
console.log('  has line break inside value:', /[\n\r]/.test(val));
console.log('  prefix:', trimmed.slice(0, 8));
console.log('  suffix:', trimmed.slice(-4));

if (trimmed.length < 40) {
  console.log('  WARNING: key looks too short (truncated paste?)');
}
if (trimmed.length > 200) {
  console.log('  WARNING: key looks unusually long (extra text pasted?)');
}
