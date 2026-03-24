import fs from 'fs';
import { execSync } from 'child_process';

console.log('Generating icons...');
try {
  execSync('npx @vite-pwa/assets-generator public/icon.svg --preset minimal', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to generate icons', e);
}

console.log('Renaming icons...');
const renames = [
  ['public/pwa-64x64.png', 'public/spool-icon-64x64.png'],
  ['public/pwa-192x192.png', 'public/spool-icon-192x192.png'],
  ['public/pwa-512x512.png', 'public/spool-icon-512x512.png'],
  ['public/maskable-icon-512x512.png', 'public/spool-maskable-icon-512x512.png'],
  ['public/apple-touch-icon-180x180.png', 'public/spool-apple-touch-icon-180x180.png'],
  ['public/favicon.ico', 'public/spool-favicon.ico']
];

for (const [oldPath, newPath] of renames) {
  if (fs.existsSync(oldPath)) {
    fs.copyFileSync(oldPath, newPath);
  }
}
console.log('Done!');
