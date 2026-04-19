import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';

/**
 * Resolve the path to the OpenAPI spec file.
 *
 * Resolution order:
 *   1. OPENAPI_SPEC_PATH env var (absolute or relative to cwd) — fully
 *      configurable for any deployment topology.
 *   2. Default: `./docs/api-contract.openapi.yaml` relative to cwd.
 *      The build script copies `../docs` into `dist/` during compilation, so
 *      at runtime the spec is at `dist/docs/api-contract.openapi.yaml`.
 *      When the server starts from the backend directory, cwd resolves this
 *      to the correct location without needing to traverse up to the repo root.
 *
 * Using process.cwd() instead of __dirname avoids the ambiguity between the
 * TypeScript source tree (src/config/) and the compiled output tree
 * (dist/config/), which caused the previous '../../../docs/...' path to
 * resolve to the wrong location after compilation.
 */
function resolveSpecPath(): string {
  if (process.env.OPENAPI_SPEC_PATH) {
    return resolve(process.env.OPENAPI_SPEC_PATH);
  }
  return join(process.cwd(), './docs/api-contract.openapi.yaml');
}

/** OpenAPI file lives at repo root: docs/api-contract.openapi.yaml */
export function loadOpenApiSpec(): Record<string, unknown> {
  const specPath = resolveSpecPath();
  const raw = readFileSync(specPath, 'utf8');
  return parseYaml(raw) as Record<string, unknown>;
}
