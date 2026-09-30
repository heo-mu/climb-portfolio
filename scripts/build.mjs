import { readdir, lstat, unlink, rmdir, realpath } from 'node:fs/promises'
import { resolve, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'))
const output = resolve(root, 'dist')

// Node's synchronous recursive removal crashes on this Windows environment.
// Clean only this project's verified output tree, using asynchronous file operations.
async function clean(directory) {
  if (directory !== output && !directory.startsWith(output + sep)) throw new Error('Build output escaped the project directory')
  let entries
  try {
    if ((await lstat(directory)).isSymbolicLink()) throw new Error('Refusing to clean a linked build directory')
    const actual = await realpath(directory)
    if (actual !== output && !actual.startsWith(output + sep)) throw new Error('Build output resolved outside dist')
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory() && !entry.isSymbolicLink()) { await clean(path); await rmdir(path) }
    else await unlink(path)
  }
}

await clean(output)
await build({ root, build: { outDir: output, emptyOutDir: false } })
