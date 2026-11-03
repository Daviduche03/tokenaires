import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: false,
  minify: false,
  noExternal: [/.*/],
  removeNodeProtocol: false,
  banner: { js: '#!/usr/bin/env node' },
});
