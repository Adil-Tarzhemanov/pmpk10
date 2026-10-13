#!/usr/bin/env node
// Проверка собранного сайта в out/ — того, что уйдёт на хостинг. Без браузера.
//
//   - каждая внутренняя ссылка, картинка, скрипт и стиль ведут на файл в out/;
//   - у каждой страницы /ru/… и /kk/… свой <html lang>, свой <title> и canonical;
//   - каждый адрес из sitemap.xml существует, а robots.txt на него указывает;
//   - на каждую русскую страницу есть казахская и наоборот.
// Внешние ссылки (birge.astana.kz, egov.kz…) не проверяются: сеть в CI ненадёжна.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(new URL('../out', import.meta.url))
if (!existsSync(OUT)) {
  console.log('Нет out/: сначала npm run build')
  process.exit(1)
}

const errors = []

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      // Папка вместо файла перехода — сборка на Windows без scripts/flatten-segments.mjs
      if (name.startsWith('__next.')) errors.push(`${relative(OUT, full)}: папка вместо файла перехода, запустите npm run build целиком`)
      else if (name !== '_next') yield* htmlFiles(full)
    } else if (name.endsWith('.html')) yield full
  }
}

/** Адрес страницы по файлу: out/ru/about/index.html → /ru/about/ */
const pageUrl = (file) =>
  '/' + relative(OUT, file).replaceAll('\\', '/').replace(/index\.html$/, '').replace(/\.html$/, '')

/** Есть ли в out/ то, на что ведёт адрес */
function resolves(url) {
  const path = decodeURIComponent(url.split(/[?#]/)[0])
  if (path === '' || path === '/') return existsSync(join(OUT, 'index.html'))
  const full = join(OUT, path)
  return (
    (existsSync(full) && statSync(full).isFile()) ||
    existsSync(join(full, 'index.html')) ||
    existsSync(`${full.replace(/\/$/, '')}.html`)
  )
}

const pages = [...htmlFiles(OUT)]
const urls = new Set(pages.map(pageUrl))

for (const file of pages) {
  const url = pageUrl(file)
  const html = readFileSync(file, 'utf8')
  const isServicePage = url === '/' || url.startsWith('/404') || url.startsWith('/_not-found')

  for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (!value.startsWith('/') || value.startsWith('//')) continue
    if (!resolves(value)) errors.push(`${url}: ${attr}="${value}" ведёт в никуда`)
  }
  for (const [, value] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const candidate of value.split(',').map((c) => c.trim().split(/\s+/)[0])) {
      if (candidate.startsWith('/') && !resolves(candidate)) errors.push(`${url}: srcset ${candidate} ведёт в никуда`)
    }
  }

  if (isServicePage) continue
  const lang = url.split('/')[1]
  if (!['ru', 'kk'].includes(lang)) {
    errors.push(`${url}: страница вне /ru/ и /kk/`)
    continue
  }
  if (!new RegExp(`<html[^>]*\\slang="${lang}"`).test(html)) errors.push(`${url}: <html lang> не ${lang}`)
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${url}: нет <title>`)
  if (!/<link rel="canonical"/.test(html)) errors.push(`${url}: нет canonical`)

  const twin = url.replace(/^\/(ru|kk)\//, (_, l) => `/${l === 'ru' ? 'kk' : 'ru'}/`)
  if (!urls.has(twin)) errors.push(`${url}: нет пары на другом языке (${twin})`)
}

/* sitemap.xml и robots.txt */
const sitemap = readFileSync(join(OUT, 'sitemap.xml'), 'utf8')
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (locs.length === 0) errors.push('sitemap.xml: пустой')
for (const loc of locs) {
  const { pathname } = new URL(loc)
  if (!resolves(pathname)) errors.push(`sitemap.xml: ${pathname} нет в out/`)
}
const robots = readFileSync(join(OUT, 'robots.txt'), 'utf8')
// Демо на *.vercel.app закрыто от поиска целиком (lib/site.ts, IS_PREVIEW) — это нормально
if (/^Disallow: \/\s*$/m.test(robots)) {
  console.log('robots.txt закрывает весь сайт: это демо-сборка без NEXT_PUBLIC_SITE_URL')
} else if (!/Sitemap:\s*\S+\/sitemap\.xml/.test(robots)) {
  errors.push('robots.txt: нет строки Sitemap')
}

for (const e of errors) console.log(`ОШИБКА: ${e}`)
console.log(`\nСборка: ${pages.length} страниц, ${locs.length} адресов в sitemap, ${errors.length} ошибок`)
process.exit(errors.length > 0 ? 1 : 0)
