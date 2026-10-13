#!/usr/bin/env node
// Обход ошибки Next.js 16 при сборке на Windows.
//
// Для быстрых переходов между страницами сборка кладёт рядом с каждой страницей
// файлы вида `__next.!KHNpdGUp.$d$lang.about.__PAGE__.txt`, и браузер просит их
// ровно по этим именам. Имя собирается заменой «/» на «.» в пути сегмента
// (convertSegmentPathToStaticExportFilename), а на Windows путь приходит с «\»:
// вместо одного файла получается папка `__next.!KHNpdGUp\$d$lang\about\__PAGE__.txt`.
// Браузер получает 404 на каждый переход, сайт работает, но медленнее и с
// ошибками в консоли. На Linux (Vercel, CI) этого нет, и скрипт ничего не делает.
//
// Скрипт превращает такие папки обратно в файлы с точками. Запускается сам
// после `npm run build` (postbuild в package.json).
import { existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(new URL('../out', import.meta.url))
let moved = 0

function* files(dir, prefix) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* files(full, `${prefix}.${name}`)
    else yield [full, `${prefix}.${name}`]
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (!statSync(full).isDirectory()) continue
    if (name.startsWith('__next.')) {
      for (const [file, flat] of [...files(full, name)]) {
        renameSync(file, join(dir, flat))
        moved++
      }
      rmSync(full, { recursive: true })
    } else if (name !== '_next') {
      walk(full)
    }
  }
}

if (existsSync(OUT)) walk(OUT)
if (moved > 0) console.log(`flatten-segments: ${moved} файлов переходов переименовано (сборка на Windows)`)
