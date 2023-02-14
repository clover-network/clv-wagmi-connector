import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  splitting: true,
  clean: true,
  dts: true,
  format: 'esm',
})
