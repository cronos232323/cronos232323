import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = ['README.md'];
for (const directory of ['docs', 'projetos', 'modelos']) collect(directory);
function collect(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (file.endsWith('.md')) files.push(file);
  }
}
const errors = [];
let references = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const targets = [...text.matchAll(/\]\(([^\s)]+)\)/g), ...text.matchAll(/(?:src|srcset)="([^"]+)"/g)];
  for (const match of targets) {
    const target = match[1];
    if (/^(?:[a-z]+:|#|\/\/)/i.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target.split(/[?#]/)[0]));
    if (!resolved.startsWith(root + path.sep) || !existsSync(resolved)) errors.push(`${file}: referência ausente ou fora do projeto: ${target}`);
    references++;
  }
}
const banner = readFileSync('assets/banner-cronos23-animated-v3.svg', 'utf8');
if (!banner.includes('viewBox="0 0 1200 400"')) errors.push('Banner com dimensões inesperadas');
if (/<script\b|\bon\w+\s*=/i.test(banner)) errors.push('Banner contém código executável inesperado');
if (!banner.includes('prefers-reduced-motion')) errors.push('Banner sem movimento reduzido');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`${files.length} documentos e ${references} referências locais conferidos; banner validado estruturalmente.`);