#!/usr/bin/env node
// Поддельный GitHub Contents API для сквозных тестов админки.
//
// Админка пишет правки коммитами через api.github.com. В тестах она ходит сюда
// (переменная CONTENT_API), а здесь «репозиторий» — временная папка с копией
// content/ и public/. Повторено ровно то, на что админка опирается:
//   - GET файла отдаёт содержимое в base64 и sha, GET папки — список, 404 если нет;
//   - PUT без sha поверх существующего файла — 422, с устаревшим sha — 409;
//   - DELETE с устаревшим sha — 409.
// sha считается как у git (blob), так что устаревший sha здесь тот же, что на GitHub.
//
// Служебные адреса для тестов:
//   POST /__reset         — вернуть исходное содержимое и очистить журнал
//   GET  /__commits       — журнал записей: [{ method, path, message }]
//   POST /__fail?status=  — следующая запись ответит этим кодом
//   POST /__write?path=   — записать файл в обход админки (тело — содержимое),
//                           как будто его сохранили из другой вкладки
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const PORT = Number(process.env.FAKE_GITHUB_PORT ?? 4311)
const ROOT = process.env.FAKE_GITHUB_ROOT ?? join(tmpdir(), 'pmpk10-e2e-repo')

let commits = []
let failNext = 0

function reset() {
  rmSync(ROOT, { recursive: true, force: true })
  mkdirSync(ROOT, { recursive: true })
  cpSync(join(REPO_ROOT, 'content'), join(ROOT, 'content'), { recursive: true })
  mkdirSync(join(ROOT, 'public', 'uploads'), { recursive: true })
  commits = []
  failNext = 0
}

const blobSha = (bytes) =>
  createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')

/** Путь из адреса в путь на диске, без выхода за пределы «репозитория» */
function resolve(repoPath) {
  const full = join(ROOT, ...repoPath.split('/').filter(Boolean))
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null
  return full
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function contents(req, res, repoPath) {
  const file = resolve(repoPath)
  if (!file) return send(res, 400, { message: 'bad path' })
  const present = existsSync(file)

  if (req.method === 'GET') {
    if (!present) return send(res, 404, { message: 'Not Found' })
    if (statSync(file).isDirectory()) {
      return send(res, 200, readdirSync(file).map((name) => ({
        name,
        path: `${repoPath.replace(/\/$/, '')}/${name}`,
        type: statSync(join(file, name)).isDirectory() ? 'dir' : 'file',
      })))
    }
    const bytes = readFileSync(file)
    return send(res, 200, { content: bytes.toString('base64'), sha: blobSha(bytes), encoding: 'base64' })
  }

  const body = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  if (failNext) {
    const status = failNext
    failNext = 0
    return send(res, status, { message: 'injected failure' })
  }

  if (req.method === 'PUT') {
    if (present) {
      const current = blobSha(readFileSync(file))
      if (!body.sha) return send(res, 422, { message: '"sha" wasn\'t supplied.' })
      if (body.sha !== current) return send(res, 409, { message: `does not match ${current}` })
    }
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, Buffer.from(body.content, 'base64'))
    commits.push({ method: 'PUT', path: repoPath, message: body.message })
    return send(res, present ? 200 : 201, { content: { path: repoPath } })
  }

  if (req.method === 'DELETE') {
    if (!present) return send(res, 404, { message: 'Not Found' })
    if (body.sha !== blobSha(readFileSync(file))) return send(res, 409, { message: 'sha mismatch' })
    unlinkSync(file)
    commits.push({ method: 'DELETE', path: repoPath, message: body.message })
    return send(res, 200, {})
  }

  return send(res, 405, { message: 'method' })
}

reset()

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
    if (url.pathname === '/__reset') { reset(); return send(res, 200, { ok: true }) }
    if (url.pathname === '/__commits') return send(res, 200, commits)
    if (url.pathname === '/__fail') { failNext = Number(url.searchParams.get('status') ?? 500); return send(res, 200, {}) }
    if (url.pathname === '/__write') {
      const file = resolve(url.searchParams.get('path') ?? '')
      writeFileSync(file, await readBody(req))
      return send(res, 200, {})
    }
    if (url.pathname === '/__health') return send(res, 200, { root: relative(REPO_ROOT, ROOT) })

    const match = url.pathname.match(/^\/repos\/[^/]+\/[^/]+\/contents\/(.*)$/)
    if (!match) return send(res, 404, { message: 'Not Found' })
    return await contents(req, res, decodeURIComponent(match[1]))
  } catch (error) {
    send(res, 500, { message: String(error) })
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`fake GitHub on http://127.0.0.1:${PORT}, repository in ${ROOT}`)
})
