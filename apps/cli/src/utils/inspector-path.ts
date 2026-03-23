import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getInspectorDistPath(): string | null {
  const candidates = [
    // Bundled with CLI (npm installed or production build)
    path.resolve(__dirname, 'inspector'),
    // Development: running from apps/cli/dist/
    path.resolve(__dirname, '../../inspector/dist'),
    // Development: running from apps/cli/src/ (tsx)
    path.resolve(__dirname, '../../../inspector/dist'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return null;
}
