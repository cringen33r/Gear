# О плане

Цель — не «выучить Vite», а понимать **как код превращается в артефакты** и уметь чинить/настраивать сборку в реальном проекте: резолвинг, транспиляция, граф модулей, чанки, кэш, дев-сервер.

Порядок модулей не случайный: каждый следующий опирается на предыдущий. Модули 0–2 — теория, без которой всё остальное превращается в копипаст конфигов. Модули 3–5 — конкретные инструменты. Модули 6–10 — эксплуатация.

Ориентир по объёму: 0–2 ≈ 40% времени, 3–5 ≈ 35%, 6–10 ≈ 25%.

Метка готовности модуля — не «прочитал», а **«собрал руками и сломал»**. В конце каждого модуля есть практика и вопросы для самопроверки.

---
# Модуль 0 — Модульные системы и загрузка кода

Без этого модуля любой бандлер выглядит магией.

**База знаний по модулю готова: [[00 MOC — Модульные системы и загрузка кода]]** — 37 связанных заметок с разбором каждого пункта ниже.

- [ ] Добандлерная эпоха: `<script>`, глобальные неймспейсы, IIFE, порядок подключения, конфликты
- [ ] CommonJS: `require`/`module.exports`, синхронность, динамичность, почему по нему нельзя tree-shaking
- [ ] AMD и UMD: зачем существовали, где встречаются до сих пор
- [ ] ESM как спецификация: статическая структура, hoisting импортов, live bindings, единственный экземпляр модуля
- [ ] Фазы ESM: construction → instantiation → evaluation; циклические зависимости и что при них происходит
- [ ] `<script type="module">`: defer по умолчанию, CORS, strict mode, отдельная область видимости
- [ ] Динамический `import()`, `import.meta`, top-level await и его влияние на формат вывода
- [ ] Резолвинг спецификаторов: относительные, абсолютные, bare specifiers
- [ ] Import maps в браузере
- [ ] Резолвинг в Node: `main`, `module`, `browser`, `types`
- [ ] Поле `exports`: subpath exports, conditional exports (`import`/`require`/`browser`/`node`/`default`), инкапсуляция пакета
- [ ] Поле `imports` и `#`-алиасы внутри пакета
- [ ] `"type": "module"`, расширения `.mjs`/`.cjs`, dual package hazard
- [ ] ESM ↔ CJS interop: `default`-обёртки, named exports из CJS, `__esModule`
- [ ] `sideEffects` в `package.json` — что это обещает бандлеру

**Практика**
- [ ] Собрать страницу на голом ESM без бандлера, посмотреть в Network водопад запросов
- [ ] Опубликовать локально пакет с `exports` на три условия и подключить его из ESM, CJS и браузера
- [ ] Воспроизвести dual package hazard (два экземпляра одного модуля) и починить

**Самопроверка**
- Почему tree-shaking возможен для ESM и невозможен в общем случае для CJS?
- Что вернёт `import x from './cjs-module.js'` и почему?
- В каком порядке выполнятся модули при циклической зависимости?

---
# Модуль 1 — Транспиляция и компиляция

- [ ] Конвейер: source → tokens → AST → transform → codegen; что такое ESTree
- [ ] Разница транспиляции, компиляции и трансформации
- [ ] TypeScript: `tsc` как компилятор и как type-checker — это две разные роли
- [ ] `tsconfig.json` предметно: `target`, `module`, `moduleResolution` (`node10`/`node16`/`nodenext`/`bundler`), `lib`, `paths`, `baseUrl`
- [ ] `isolatedModules` — почему он обязателен для esbuild/swc и что ломает
- [ ] `verbatimModuleSyntax`, `importsNotUsedAsValues`, `type`-импорты и их стирание
- [ ] `declaration`, `declarationMap`, `composite`, project references, `incremental`
- [ ] Downleveling и хелперы: `tslib`, `importHelpers`, `@babel/runtime`
- [ ] Babel: `presets` vs `plugins`, порядок применения, `@babel/preset-env`
- [ ] Browserslist: где задаётся, как читается разными инструментами, `npx browserslist` для проверки
- [ ] Полифилы: `core-js`, `useBuiltIns: entry|usage`, чем полифил отличается от хелпера
- [ ] SWC и esbuild как транспиляторы: скорость ценой отказа от проверки типов
- [ ] Почему Vite/esbuild «не видят» ошибок типов и как возвращать проверку (`tsc --noEmit` отдельным шагом)
- [ ] Oxc / Rust-тулчейн: где он уже применяется

**Практика**
- [ ] Один и тот же файл прогнать через `tsc`, `babel`, `esbuild`, `swc` и сравнить вывод
- [ ] Подобрать `target`+browserslist так, чтобы получить/убрать конкретный хелпер в выводе
- [ ] Настроить project references в монорепе и увидеть инкрементальную пересборку

**Самопроверка**
- Что делает `isolatedModules` и почему без него `const enum` опасен?
- Чем `moduleResolution: bundler` отличается от `node16`?

---
# Модуль 2 — Бандлеры: теория, общая для всех

Ключевой модуль. После него любой конкретный бандлер читается как вариация.

- [ ] Зачем бандлить сегодня: водопад запросов, HTTP/2 и его пределы, стоимость запроса vs стоимость размера
- [ ] Граф модулей: entry points, обход, разрешение зависимостей, виртуальные модули
- [ ] Code splitting: точки входа, динамические импорты, общие (shared/vendor) чанки, `manualChunks`
- [ ] Tree shaking: статический анализ, side effects, `/*#__PURE__*/`, `sideEffects: false`, почему он часто не срабатывает
- [ ] Dead code elimination vs tree shaking — разные вещи
- [ ] Scope hoisting (module concatenation): что даёт и когда невозможен
- [ ] Минификация: terser / esbuild / swc / oxc; `compress`, `mangle`, mangle свойств и его опасность
- [ ] Source maps: `eval`, `cheap`, `inline`, `hidden`, `sourcesContent`; что публиковать в прод
- [ ] Форматы вывода: `esm`, `cjs`, `iife`, `umd`, `system` — когда какой
- [ ] Хеширование имён файлов, content hash, long-term caching, инвалидация, `manifest.json`
- [ ] Runtime бандлера: как загружаются чанки, что такое чанк-лоадер и почему хеш вендора «плывёт»
- [ ] Ассеты: CSS, изображения, шрифты, `?url`/`?raw`/inline-лимиты, data URI
- [ ] Externals: что не бандлить и почему (peerDependencies, CDN)
- [ ] Кэш сборки: in-memory, файловый, ключи инвалидации

**Практика**
- [ ] Собрать один проект в 4 форматах вывода и сравнить артефакты
- [ ] Сломать tree-shaking намеренно (побочный эффект в модуле) и найти причину по бандлу
- [ ] Добиться стабильного хеша вендорного чанка при изменении кода приложения

**Самопроверка**
- Почему `import './styles.css'` мешает tree-shaking, если не объявлены `sideEffects`?
- Что произойдёт с кэшем клиента при добавлении одной зависимости?

---
# Модуль 3 — webpack

Даже если вы на Vite/esbuild — webpack придётся читать в чужих проектах.

- [ ] Структура конфига: `entry`, `output`, `module.rules`, `resolve`, `plugins`, `optimization`, `mode`, `target`
- [ ] Loaders: цепочка, порядок справа налево, `enforce: pre|post`, `oneOf`
- [ ] Plugins и `tapable`: хуки компилятора и компиляции, жизненный цикл сборки
- [ ] `resolve.alias`, `resolve.extensions`, `resolve.modules`, `resolve.conditionNames`, `fallback` для node-полифилов
- [ ] Asset Modules (`asset/resource`, `asset/inline`, `asset/source`) вместо file/url-loader
- [ ] `optimization.splitChunks`: `cacheGroups`, `chunks`, `minSize`, `maxInitialRequests`
- [ ] `runtimeChunk`, `moduleIds`, `chunkIds` и детерминированность
- [ ] Персистентный кэш (`cache: { type: 'filesystem' }`), `buildDependencies`
- [ ] webpack-dev-server, dev-middleware, proxy, history API fallback
- [ ] HMR: как устроен, `module.hot`, почему фреймворкам нужен свой HMR-рантайм
- [ ] Module Federation: `remotes`, `exposes`, `shared`, `singleton`, `eager`, версии; MF v2
- [ ] Анализ: `stats.json`, `webpack-bundle-analyzer`, `speed-measure-webpack-plugin`
- [ ] Rspack как быстрая замена: где совместим, где нет

**Практика**
- [ ] Написать свой loader (например, инъекция баннера) и свой plugin (отчёт о размерах)
- [ ] Настроить splitChunks под конкретную цель: отдельный vendor, отдельный чанк для тяжёлой библиотеки
- [ ] Поднять host + remote на Module Federation с общим singleton-зависимостью

---
# Модуль 4 — Rollup, Vite, Rolldown, esbuild

- [ ] Rollup: философия, ориентация на библиотеки, ESM-first
- [ ] Плагин-API Rollup: `resolveId`, `load`, `transform`, `buildEnd`, `renderChunk`, `generateBundle`; порядок и `enforce`
- [ ] Rollup output: `preserveModules`, `output.manualChunks`, `external`, `interop`
- [ ] esbuild как бандлер: скорость, plugin-API, осознанные ограничения (нет типов, ограниченный code splitting, CSS)
- [ ] Vite: две разные машины — dev (нативный ESM + on-demand transform) и prod (Rollup)
- [ ] `optimizeDeps` / pre-bundling: зачем CJS-зависимости прогоняются через esbuild, когда кэш протухает
- [ ] Конфиг Vite: `root`, `base`, `publicDir`, `resolve.alias`, `define`, `envPrefix`, `server.proxy`, `build.*`
- [ ] Vite HMR API: `import.meta.hot.accept/dispose/invalidate`
- [ ] Плагины Vite: `enforce: pre|post`, `apply: serve|build`, специфичные хуки (`config`, `configResolved`, `transformIndexHtml`)
- [ ] Vite SSR: `ssrLoadModule`, `ssr.noExternal`, разделение клиентского и серверного графа
- [ ] Library mode в Vite: сборка npm-пакета
- [ ] Rolldown: Rust-порт Rollup, `rolldown-vite`, что меняется на практике
- [ ] Environment API и куда движется Vite

**Практика**
- [ ] Написать плагин Vite/Rollup с виртуальным модулем (например, генерация версии сборки)
- [ ] Собрать библиотеку в library mode с корректными `exports` и типами
- [ ] Диагностировать «зависимость не пре-бандлится» и починить через `optimizeDeps.include/exclude`

---
# Модуль 5 — Angular build system

- [ ] История: `@angular-devkit/build-angular` (webpack) → `browser-esbuild` → `@angular/build:application`
- [ ] `angular.json`: `projects` → `architect` → targets → `builder` / `options` / `configurations`
- [ ] `fileReplacements`, `budgets`, `assets`, `styles`, `scripts`, `outputHashing`, `optimization`
- [ ] Application builder: esbuild для сборки + Vite как дев-сервер; чем это отличается от «Angular на Vite»
- [ ] Компиляция Angular: ngtsc, AOT vs JIT, декораторы → фабрики, partial compilation
- [ ] Angular linker: почему библиотеки публикуются в partial-формате и когда линкуется
- [ ] `ng-packagr` и Angular Package Format: структура выходного пакета, entry points, вторичные entry points
- [ ] Ленивая загрузка: `loadComponent`/`loadChildren`, влияние на чанки
- [ ] `@defer` блоки и как они отражаются в графе чанков
- [ ] SSR/SSG: `outputMode`, prerender, server routes, гидратация (в т.ч. инкрементальная)
- [ ] Zoneless и его влияние на полифилы/бандл
- [ ] Стили: `inlineStyleLanguage`, `stylePreprocessorOptions.includePaths`, компонентные стили и их изоляция
- [ ] i18n: `@angular/localize`, сборка на локаль, `localize` в билдере
- [ ] Расширение сборки: `@angular-builders/custom-webpack`, custom builders, esbuild-плагины через хуки
- [ ] Angular Service Worker: `ngsw-config.json`, стратегии кэширования
- [ ] Анализ бандла Angular: `--stats-json`, `source-map-explorer`, esbuild metafile

**Практика**
- [ ] Перевести проект с webpack-билдера на application builder и разобрать все поломки
- [ ] Собрать библиотеку через ng-packagr и подключить её локально в приложение
- [ ] Настроить бюджеты так, чтобы CI падал при превышении, и осознанно уложиться

---
# Модуль 6 — Монорепы и масштаб

- [ ] Пакетные менеджеры: npm / yarn / pnpm — layout `node_modules`, hoisting, phantom dependencies, symlink-стратегия pnpm
- [ ] Workspaces: npm/yarn/pnpm workspaces, протокол `workspace:`
- [ ] Lock-файлы: детерминизм, `npm ci`, конфликты при мерже
- [ ] Nx: project graph, task graph, targets, executors, `nx affected`
- [ ] Кэш Nx: локальный и удалённый, ключи кэша, что ломает кэш
- [ ] Границы модулей (`@nx/enforce-module-boundaries`), теги, слоистая архитектура
- [ ] Turborepo для сравнения: pipeline, кэш, remote cache
- [ ] Инкрементальная сборка библиотек vs buildable libs vs прямой импорт исходников
- [ ] TS project references в монорепе
- [ ] Версионирование и публикация: changesets, semver, provenance

**Практика**
- [ ] Замерить время сборки с холодным и тёплым кэшем, объяснить разницу
- [ ] Найти phantom dependency в проекте и устранить
- [ ] Настроить `affected`-пайплайн для PR

---
# Модуль 7 — Оптимизация и производительность

- [ ] Что измеряем: размер бандла, parse/eval time, LCP, TBT, INP; Coverage в DevTools
- [ ] Инструменты анализа: `source-map-explorer`, `webpack-bundle-analyzer`, `rollup-plugin-visualizer`, esbuild `--metafile`
- [ ] Стратегии сплита: по маршрутам, по фичам, по вендорам; где сплит вредит
- [ ] `preload` / `prefetch` / `modulepreload`, приоритеты ресурсов
- [ ] Ленивая загрузка тяжёлых зависимостей (графики, редакторы, i18n-словари)
- [ ] Дублирование зависимостей: разные версии в графе, `npm ls`, dedupe
- [ ] Компрессия: gzip / brotli / zstd — на сборке и на сервере, precompressed-ассеты
- [ ] CSS: удаление неиспользуемого, critical CSS, CSS modules, цена CSS-in-JS в рантайме
- [ ] Шрифты и изображения: форматы, subsetting, `preload`, responsive images
- [ ] Web Workers и WASM: как они попадают в граф сборки
- [ ] Кэширование: immutable-ассеты, HTML без кэша, версионирование
- [ ] Когда оптимизация не нужна: измеряйте до, а не после

**Практика**
- [ ] Найти в реальном проекте топ-5 модулей по вкладу в размер и сократить хотя бы один
- [ ] Настроить размерные бюджеты и превратить их в блокирующую проверку

---
# Модуль 8 — Конфигурация окружения и безопасность сборки

- [ ] Переменные окружения: `define`/`DefinePlugin`, подстановка на этапе сборки vs рантайм-конфиг
- [ ] Почему секреты в env фронтенда — это публичные данные
- [ ] Рантайм-конфигурация (загрузка `config.json` при старте) как альтернатива пересборке на окружение
- [ ] Source maps в проде: приватные (`hidden`) + загрузка в мониторинг вместо публикации
- [ ] CSP и сборка: inline-скрипты/стили, nonce, `unsafe-inline`, что генерирует бандлер
- [ ] Subresource Integrity и хеши ассетов
- [ ] Воспроизводимые сборки: lock-файлы, пиннинг версий, `npm ci`, детерминированные id
- [ ] Supply chain: аудит зависимостей, postinstall-скрипты, provenance/подписи

---
# Модуль 9 — Сборка в CI/CD

- [ ] Кэширование в CI: зависимости отдельно, кэш сборщика отдельно, корректные ключи
- [ ] Артефакты сборки и их передача между джобами
- [ ] Гейты: типы (`tsc --noEmit`), линт, тесты, бюджеты размера (`size-limit`)
- [ ] Матрица сборок: несколько окружений/локалей/таргетов
- [ ] Preview-деплои на PR
- [ ] Загрузка source maps в систему мониторинга ошибок
- [ ] Время сборки как метрика: что мерить и где узкое место

---
# Модуль 10 — Диагностика: типовые поломки

Этот модуль лучше проходить последним и возвращаться к нему как к справочнику.

- [ ] `Cannot use import statement outside a module` — причины и три разных лечения
- [ ] `require is not defined` в браузерном бандле
- [ ] `X is not a function` после смены формата вывода — interop default/named
- [ ] Дублирование библиотеки (две React/RxJS/Angular в графе) — как обнаружить и как схлопнуть
- [ ] Конфликт `paths` (TS) и `alias` (бандлер): почему типы резолвятся, а сборка падает
- [ ] Пакет с некорректным `exports` — обходные пути без форка
- [ ] Node-встроенные модули в браузерном бандле (`buffer`, `process`, `path`) — polyfill или отказ
- [ ] Кэш соврал: когда и как чистить (`node_modules/.vite`, `.angular/cache`, webpack fs-cache, кэш Nx)
- [ ] HMR не работает / перезагружает страницу целиком — что проверять
- [ ] Прод собирается, дев работает иначе — источники расхождения (define, условные exports, минификация)
- [ ] Отладка плагинов и лоадеров: логирование трансформов, промежуточный вывод

---
# Практические вехи

Проекты, каждый из которых проверяет весь предыдущий материал.

- [ ] **Веха 1.** Приложение без бандлера: только нативный ESM + import maps. Понять, что именно потом сделает за вас бандлер.
- [ ] **Веха 2.** Собрать одно и то же SPA тремя способами: webpack, Vite, esbuild напрямую. Сравнить конфиги, время, вывод.
- [ ] **Веха 3.** Опубликовать npm-библиотеку с корректными `exports`, типами, ESM+CJS и без dual package hazard.
- [ ] **Веха 4.** Angular-приложение: перевод на application builder, настройка бюджетов, ленивых маршрутов, SSR.
- [ ] **Веха 5.** Монорепа: несколько приложений и библиотек, кэш, `affected`, CI-пайплайн со всеми гейтами.
- [ ] **Веха 6.** Взять чужой проект с медленной/сломанной сборкой и починить, зафиксировав измерения до и после.

---
# Как понять, что тема закрыта

Признак владения темой — умение ответить не «какую опцию включить», а **почему**:

- Читаете незнакомый конфиг сборки и предсказываете структуру выходных файлов
- По имени файла в бандле находите, откуда он взялся, без гугла
- Понимаете, какой шаг конвейера сломался, по одному тексту ошибки
- Можете обосновать выбор бандлера для конкретного проекта, а не по моде
- Написали хотя бы один свой плагин и один свой loader

---
# Связанные заметки

- [[Общее]] — обзор инструментов проекта
- [[Пакетные менеджеры]]
- [[Nx]]
- [[CLI]] — Angular CLI
- [[Конфигурация (ESLint + stylelint + Prettier + Husky + VSCode)]]
