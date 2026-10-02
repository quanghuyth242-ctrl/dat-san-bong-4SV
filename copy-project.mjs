import { cpSync } from 'node:fs';
for (const d of ['project/css', 'project/js', 'project/pages']) {
  cpSync(d, 'dist/' + d, { recursive: true });
}
console.log('Copied project files to dist/');
