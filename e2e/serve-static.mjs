#!/usr/bin/env node
// Раздаёт собранный сайт из out/ так же, как обычный веб-сервер на хостинге:
// /ru/about/ → out/ru/about/index.html, неизвестный адрес → out/404.html с кодом 404.
// Своё, а не пакет: несколько строк, и правила видно целиком.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../out', import.meta.url))
const PORT = Number(process.env.SITE_PORT ?? 4310)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
}

function find(pathname) {
  const file = normalize(join(ROOT, decodeURIComponent(pathname)))
  if (file !== ROOT && !file.startsWith(ROOT + sep)) return null
  if (existsSync(file) && statSync(file).isFile()) return file
  const index = join(file, 'index.html')
  if (existsSync(index)) return index
  if (existsSync(`${file}.html`)) return `${file}.html`
  return null
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  const file = find(pathname)
  if (!file) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] })
    return res.end(readFileSync(join(ROOT, '404.html')))
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
}).listen(PORT, '127.0.0.1', () => console.log(`site from out/ on http://127.0.0.1:${PORT}`))
