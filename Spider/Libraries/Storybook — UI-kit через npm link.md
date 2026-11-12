Памятка: как локально подсунуть Storybook свежую сборку UI-kit вместо версии из реестра. Это **вариант A** из [[Storybook — UI-kit из исходников с HMR#3.0 Сначала: а нужен ли вообще режим исходников]] — начинать надо с него, он дешевле и проверяет ровно тот артефакт, который уедет в реестр.

Стек: Angular 21, Storybook 10 (`@storybook/angular-vite`), Vite 8, npm.

---
# Главное правило

> [!important] Линкуется `dist/ui-kit`, а не корень репозитория
> В репо библиотеки три `package.json`, и только один из них годится:
>
> | Путь | `name` | Точки входа | Годится |
> |---|---|---|---|
> | `ui-kit/package.json` | имя рабочей области (`ui-kit-workspace`) | — | нет |
> | `ui-kit/projects/ui-kit/package.json` | `@acme/ui-kit` | **нет** — их генерирует ng-packagr | нет |
> | `ui-kit/dist/ui-kit/package.json` | `@acme/ui-kit` | `exports`, `fesm2022`, `typings` | **да** |
>
> Отсюда следствие: **сначала собрать, потом линковать.** До первой сборки папки `dist/ui-kit` просто не существует.

Плейсхолдеры: `@acme/ui-kit` — имя пакета, `ui-kit` — имя проекта библиотеки в `angular.json` её репозитория, `~/repos/*` — ваши пути.

---
# Алгоритм

## Шаг 1. Разовая настройка (один раз на машину)

```bash
# ── в репозитории библиотеки ──────────────────────────────────────────────
cd ~/repos/ui-kit
npm ci
ng build ui-kit                  # обязательно ДО npm link: создаёт dist/ui-kit

cd dist/ui-kit                   # ← ключевой момент, линкуем именно отсюда
npm link                         # регистрирует @acme/ui-kit в глобальном реестре npm

# ── в репозитории сторибука ───────────────────────────────────────────────
cd ~/repos/storybook
npm link @acme/ui-kit            # node_modules/@acme/ui-kit → ~/repos/ui-kit/dist/ui-kit
```

Короткая форма, без глобального реестра (делает оба шага сразу, выполняется только в репо сторибука):

```bash
cd ~/repos/storybook
npm link ../ui-kit/dist/ui-kit
```

Проверить, что связь встала:

```bash
ls -l node_modules/@acme/                     # должна быть стрелка симлинка
readlink -f node_modules/@acme/ui-kit         # должен вывести ~/repos/ui-kit/dist/ui-kit
npm ls @acme/ui-kit                           # покажет "-> ./../ui-kit/dist/ui-kit"
```

## Шаг 2. Настройка Storybook (один раз, коммитится)

Два пункта в `.storybook/main.ts`. Оба нужны из-за того, что симлинк разыменовывается в реальный путь **вне** проекта сторибука.

```ts
async viteFinal(config) {
  const { mergeConfig, searchForWorkspaceRoot } = await import('vite');
  const { resolve } = await import('node:path');

  return mergeConfig(config, {
    server: {
      fs: {
        // Реальный путь пакета — в другом репозитории, то есть вне workspace root.
        // Без этого Vite отдаёт 403 на /@fs/... и файл даже не попадает в вотчер.
        // ВАЖНО: явный allow отключает автоопределение workspace root,
        // поэтому свой корень возвращаем первым элементом.
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          resolve(process.cwd(), '../ui-kit'),
        ],
      },
    },
    resolve: {
      // Файлы из dist/ui-kit импортируют '@angular/core' и резолвят его
      // ВВЕРХ ОТ СЕБЯ — то есть в ~/repos/ui-kit/node_modules.
      // Получаются два Angular в одном графе: NG0203, NullInjectorError
      // на существующий провайдер, ломающийся instanceof.
      // dedupe заставляет резолвить эти пакеты всегда от корня сторибука.
      dedupe: [
        '@angular/core',
        '@angular/common',
        '@angular/common/http',
        '@angular/forms',
        '@angular/router',
        '@angular/animations',
        '@angular/platform-browser',
        '@angular/cdk',
        'rxjs',
        'tslib',
      ],
      // Должно остаться false (дефолт). Если поставить true — путь модуля
      // останется внутри node_modules, а вотчер Vite игнорирует
      // **/node_modules/**, и пересборки перестанут подхватываться.
      preserveSymlinks: false,
    },
  });
}
```

Это безопасно для CI: `fs.allow` на несуществующую папку и `dedupe` на пакеты, которые и так в единственном экземпляре, — no-op.

> [!note] Почему `optimizeDeps.exclude` не нужен
> Vite не предбандлит **слинкованные** пакеты: он резолвит симлинк в реальный путь, видит, что тот вне `node_modules`, и обращается с пакетом как с исходником. Именно поэтому изменения вообще подхватываются. Если вы сами добавляли `@acme/ui-kit` в `optimizeDeps.include` ради скорости — уберите на время линковки, иначе будете смотреть на застывший артефакт из `node_modules/.vite`.

## Шаг 3. Рабочий цикл

Два терминала:

```bash
# терминал 1 — репо библиотеки: пересборка по сохранению
cd ~/repos/ui-kit
ng build ui-kit --watch

# терминал 2 — репо сторибука: обычный запуск, ничего специального
cd ~/repos/storybook
npm run storybook
```

Правка в библиотеке → ng-packagr пересобирает `dist` → Vite видит изменившиеся файлы → перезагружает превью. Состояние компонента при этом теряется (это full reload, не HMR) — если мешает, смотрите вариант B в [[Storybook — UI-kit из исходников с HMR]].

## Шаг 4. Откат

```bash
cd ~/repos/storybook
npm unlink @acme/ui-kit          # снять связь
npm install                      # вернуть версию из реестра по lock-файлу

# при сомнениях — надёжнее полностью:
rm -rf node_modules && npm ci

# убрать из глобального реестра npm (не обязательно)
cd ~/repos/ui-kit/dist/ui-kit && npm unlink -g
```

Проверка отката: `npm ls @acme/ui-kit` должен показать номер версии, а не стрелку на путь.

---
# Как убедиться, что работает именно линк

1. **Резолв.** В DevTools → Network найдите запрос к коду библиотеки. Путь должен содержать `/@fs/…/ui-kit/dist/ui-kit/fesm2022/…`, а не `node_modules/.vite/deps/…`.
2. **Пересборка.** Внесите заметное изменение (например, поменяйте текст в шаблоне), сохраните. В терминале с `--watch` должна пробежать пересборка, в браузере — перезагрузиться превью.
3. **Нет дублей Angular.** В Network отфильтруйте по `core.mjs`. Все запросы должны идти из `node_modules` **репозитория сторибука**. Если хоть один ведёт в `ui-kit/node_modules` — dedupe не сработал.

---
# Грабли

| Симптом | Причина | Что делать |
|---|---|---|
| `npm link` в репо библиотеки → в сторибуке пакет не находится | линковали корень репо, там другое `name` | линковать из `dist/ui-kit` |
| `ENOENT` при `npm link` | `dist/ui-kit` ещё не создан | сначала `ng build ui-kit` |
| **403** на `/@fs/...`, `outside of Vite serving allow list` | реальный путь вне workspace root | `server.fs.allow`, шаг 2 |
| `NG0203`, `NullInjectorError` на существующий провайдер, странный `instanceof` | два экземпляра Angular из `ui-kit/node_modules` | `resolve.dedupe`, шаг 2 |
| Пересборки не подхватываются, в браузере старый код | пакет предбандлен (`node_modules/.vite/deps`) либо стоит `preserveSymlinks: true` | убрать из `optimizeDeps.include`, удалить `node_modules/.vite`, перезапустить с `--force` |
| Линк «слетел» после `npm install` / `npm ci` | npm перезаписывает симлинк версией из lock-файла | повторить `npm link @acme/ui-kit` |
| Правки видны в `dist`, но не в браузере, дев-сервер «залип» | ng-packagr пересоздал папку целиком, вотчер потерял файлы | перезапустить Storybook |
| Ошибки про unmet peer dependencies при линковке | npm 7+ строже к peerDeps слинкованного пакета | `npm link @acme/ui-kit --legacy-peer-deps` |
| Тип не совпадает с рантаймом, IDE ругается | остался старый `.d.ts` из кеша TS | перезапустить TS-сервер в IDE |

---
# Чего этот способ не даёт

- **Нет HMR.** Только полная перезагрузка превью, состояние компонента теряется.
- **Задержка = время сборки ng-packagr.** Простая библиотека — 2–5 с, много вторичных entry points — 10–30 с, потому что пересобираются пачкой.
- **Требует ручных шагов на каждой машине** и слетает после каждого `npm install`.

Если это начинает мешать — переходите на [[Storybook — UI-kit из исходников с HMR]] (вариант B): там нет сборки вообще и работает настоящий Angular-HMR, но конфигурации заметно больше и упаковка ng-packagr не проверяется.

---
# Шпаргалка

```bash
# поднять
cd ~/repos/ui-kit && ng build ui-kit && cd dist/ui-kit && npm link
cd ~/repos/storybook && npm link @acme/ui-kit
cd ~/repos/ui-kit && ng build ui-kit --watch     # терминал 1
cd ~/repos/storybook && npm run storybook        # терминал 2

# проверить
readlink -f ~/repos/storybook/node_modules/@acme/ui-kit

# снять
cd ~/repos/storybook && npm unlink @acme/ui-kit && npm install
```

---

Связанные: [[Storybook — UI-kit из исходников с HMR]] · [[Storybook]] · [[Пакетные менеджеры]] · [[Резолвинг модулей в Node.js]]
