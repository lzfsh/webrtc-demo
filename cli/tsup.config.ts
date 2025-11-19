import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'tsup'

interface PackageJson {
  name: string
  version: string
  description: string
}
const dirname = import.meta.dirname
const pkg: PackageJson = JSON.parse(readFileSync(join(dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  clean: true,
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  minify: true,
  skipNodeModulesBundle: true,
  define: {
    'process.env.NAME': JSON.stringify(pkg.name),
    'process.env.DESCRIPTION': JSON.stringify(pkg.description),
    'process.env.VERSION': JSON.stringify(pkg.version),
  },
})
