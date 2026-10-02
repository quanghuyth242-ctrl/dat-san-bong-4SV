import { cpSync } from 'node:fs';
cpSync('project', 'public/project', { recursive: true });
console.log('Successfully synchronized project to public/project');
