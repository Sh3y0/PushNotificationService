import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** OpenAPI file lives at repo root: docs/api-contract.openapi.yaml */
export function loadOpenApiSpec(): Record<string, unknown> {
  const specPath = join(__dirname, '../../../docs/api-contract.openapi.yaml');
  const raw = readFileSync(specPath, 'utf8');
  return parseYaml(raw) as Record<string, unknown>;
}
