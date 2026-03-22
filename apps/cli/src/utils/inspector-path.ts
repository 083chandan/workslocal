import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve the path to the inspector's built dist/ directory.
 * Tries multiple locations relative to the CLI's dist.
 */
export function getInspectorDistPath(): string | null {
  const candidates = [
    // Development: relative to repo root
    path.resolve(__dirname, '../../../inspector/dist'),
    // npm installed: next to cli in node_modules
    path.resolve(__dirname, '../../inspector/dist'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return null;
}
