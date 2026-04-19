import { readFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Default: `backend/openapi.yaml` next to `src/` and `dist/`.
 * Resolves via `import.meta.url` so it works with `tsx` and `node dist/server.js` regardless of `process.cwd()`
 * (required for Railway and similar deploys).
 */
function defaultSpecPath(): string {
  return join(__dirname, '..', '..', 'openapi.yaml');
}

function resolveSpecPath(): string {
  const override = process.env.OPENAPI_SPEC_PATH?.trim();
  if (override) {
    return isAbsolute(override) ? override : resolve(process.cwd(), override);
  }
  return defaultSpecPath();
}

export function loadOpenApiSpec(): Record<string, unknown> {
  const specPath = resolveSpecPath();
  const raw = readFileSync(specPath, 'utf8');
  return parseYaml(raw) as Record<string, unknown>;
}
