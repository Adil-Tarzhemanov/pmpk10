#!/usr/bin/env node
// Проверка content/ — того, что правит админка и из чего собирается сайт.
//
// Ошибки (код выхода 1) — то, что ломает сайт или делает языки неравными:
//   - файл не читается как JSON;
//   - у русской и казахской версии разная структура: другие поля, другие типы
//     или разная длина списков (админка ставит пункты в пару по номеру);
//   - у новости нет даты в виде ГГГГ-ММ-ДД, заголовка или подписи даты;
//   - ссылка /uploads/… или картинка ведёт на файл, которого нет в public/;
//   - кнопка звонка не совпадает с номером телефона.
// Предупреждения — то, что заказчица ещё не прислала: пустые строки, документы
// без файла (href "#"), новости без перевода. Сборку они не останавливают.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CONTENT = join(ROOT, 'content')
const errors = []
const warnings = []

const rel = (file) => relative(ROOT, file).replaceAll('\\', '/')

function load(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    errors.push(`${rel(file)}: не читается как JSON (${error.message})`)
    return undefined
  }
}

const kind = (value) => (Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value)

/** Одинаковая ли форма у двух версий: поля, типы, длины списков */
function sameShape(ru, kk, where) {
  if (kind(ru) !== kind(kk)) {
    errors.push(`${where}: в ru ${kind(ru)}, в kk ${kind(kk)}`)
    return
  }
  if (Array.isArray(ru)) {
    if (ru.length !== kk.length) errors.push(`${where}: в ru ${ru.length} пунктов, в kk ${kk.length}`)
    ru.slice(0, kk.length).forEach((item, i) => sameShape(item, kk[i], `${where}[${i}]`))
    return
  }
  if (kind(ru) === 'object') {
    for (const key of new Set([...Object.keys(ru), ...Object.keys(kk)])) {
      // Необязательные пометки «уточняется» и картинка могут быть только у одной версии
      if (!(key in ru) || !(key in kk)) {
        if (['tbd', 'noteTbd', 'image'].includes(key)) continue
        errors.push(`${where}.${key}: есть только в ${key in ru ? 'ru' : 'kk'}`)
        continue
      }
      sameShape(ru[key], kk[key], `${where}.${key}`)
    }
  }
}

/** Обход всех строк: пустые и ссылки на загруженные файлы */
function walkStrings(value, where, visit) {
  if (typeof value === 'string') return visit(value, where)
  if (Array.isArray(value)) return value.forEach((v, i) => walkStrings(v, `${where}[${i}]`, visit))
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, `${where}.${k}`, visit)
  }
}

function checkStrings(data, file) {
  walkStrings(data, rel(file), (text, where) => {
    if (text.trim() === '') warnings.push(`${where}: пусто`)
    if (text === '#') warnings.push(`${where}: файл ещё не выложен`)
    if (text.startsWith('/uploads/') && !existsSync(join(ROOT, 'public', text))) {
      errors.push(`${where}: нет файла public${text}`)
    }
  })
}

/* Пары ru/kk с одинаковой структурой */
const pairs = [
  ['site/ru.json', 'site/kk.json'],
  ['documents/ru.json', 'documents/kk.json'],
  ['vacancies/ru.json', 'vacancies/kk.json'],
  ...readdirSync(join(CONTENT, 'pages'))
    .filter((name) => name.endsWith('.ru.json'))
    .map((name) => [`pages/${name}`, `pages/${name.replace('.ru.json', '.kk.json')}`]),
]

for (const [ruName, kkName] of pairs) {
  const ruFile = join(CONTENT, ruName)
  const kkFile = join(CONTENT, kkName)
  if (!existsSync(kkFile)) {
    errors.push(`${rel(kkFile)}: нет казахской версии`)
    continue
  }
  const ru = load(ruFile)
  const kk = load(kkFile)
  if (ru === undefined || kk === undefined) continue
  sameShape(ru, kk, ruName.replace(/(\.ru)?\.json$/, '').replace(/\/ru$/, ''))
  checkStrings(ru, ruFile)
  checkStrings(kk, kkFile)
}

/* Кнопка звонка должна набирать тот же номер, что написан */
for (const lang of ['ru', 'kk']) {
  const site = load(join(CONTENT, 'site', `${lang}.json`))
  if (!site) continue
  const digits = site.phone.replace(/\D/g, '')
  const expected = `+${digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits}`
  if (site.phoneHref !== expected) {
    errors.push(`content/site/${lang}.json: phoneHref ${site.phoneHref}, а по телефону выходит ${expected}`)
  }
}

/* Новости: у каждой версии дата, подпись даты и заголовок; пары по имени файла */
const newsDir = (lang) => join(CONTENT, 'news', lang)
const newsNames = (lang) =>
  existsSync(newsDir(lang)) ? readdirSync(newsDir(lang)).filter((n) => n.endsWith('.json')) : []

for (const lang of ['ru', 'kk']) {
  for (const name of newsNames(lang)) {
    const file = join(newsDir(lang), name)
    const item = load(file)
    if (!item) continue
    if (!/^[a-z0-9-]+\.json$/.test(name)) errors.push(`${rel(file)}: имя файла — адрес новости, только a-z, 0-9 и дефис`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date ?? '') || Number.isNaN(Date.parse(item.date))) {
      errors.push(`${rel(file)}: дата «${item.date}» не в виде ГГГГ-ММ-ДД`)
    }
    for (const field of ['title', 'dateLabel']) {
      if (!item[field]?.trim()) errors.push(`${rel(file)}: пустое поле ${field}`)
    }
    if (!Array.isArray(item.body)) errors.push(`${rel(file)}: body должен быть списком абзацев`)
    checkStrings(item, file)
  }
}
const kkNews = new Set(newsNames('kk'))
for (const name of newsNames('ru')) {
  if (!kkNews.has(name)) warnings.push(`content/news/ru/${name}: нет казахской версии`)
}
for (const name of kkNews) {
  if (!newsNames('ru').includes(name)) warnings.push(`content/news/kk/${name}: нет русской версии`)
}

for (const w of warnings) console.log(`предупреждение: ${w}`)
for (const e of errors) console.log(`ОШИБКА: ${e}`)
console.log(`\nКонтент: ${errors.length} ошибок, ${warnings.length} предупреждений`)
process.exit(errors.length > 0 ? 1 : 0)
