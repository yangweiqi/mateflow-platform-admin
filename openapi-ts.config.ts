import { defineConfig } from '@hey-api/openapi-ts';

/**
 * OpenAPI TypeScript Code Generator Configuration
 *
 * This generates TypeScript code from the OpenAPI specification.
 * The output directory (src/services) is auto-generated and should not be manually edited.
 *
 * Note: The src/services directory is excluded from linting via .eslintignore
 * to prevent linter errors in auto-generated code during git commits.
 */
export default defineConfig({
  client: '@hey-api/client-fetch',
  input: './openapi.json',
  output: {
    format: 'prettier',
    path: './src/services',
  },
  services: {
    asClass: true,
  },
});
