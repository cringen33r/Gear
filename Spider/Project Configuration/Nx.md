# Nx: гайд и справочник

18 окт. 2026 г. · @Allan

## 1. Что такое Nx и ключевые понятия

Nx — это оркестратор задач для монорепозиториев: он строит граф проектов, понимает, что от чего зависит, и запускает build/test/lint только там, где нужно, параллельно и с кэшем. Сам Nx ничего не компилирует и не тестирует — это делают ваши инструменты (tsc, Vite, Jest, ESLint и т.д.); Nx решает, _что_, _в каком порядке_ и _надо ли вообще_ запускать. Гайд написан для **Nx 23.x** (актуальная `latest` на момент написания — 23.3, следующая мажорная 24 в бете).

Что Nx даёт сверх скриптов пакетного менеджера:

- **Граф проектов** — автоматически вычисляется из импортов и `package.json`; виден через `nx graph`.
- **Кэш вычислений** — повторный запуск с теми же входами мгновенно восстанавливает вывод и артефакты (локально или из удалённого кэша).
- **Affected** — запуск задач только для изменённых проектов и их зависимых.
- **Оркестрация** — правильный порядок (сначала build зависимостей), параллелизм, TUI.
- **Плагины** — автоматически выводят задачи из конфигов инструментов (`vite.config.ts` → задачи `build`, `serve`, `test`).
- **Генераторы и миграции** — шаблоны кода и автоматическое обновление конфигураций при обновлении версий.
- **Nx Cloud** (опционально, платный сервис с бесплатным тарифом) — удалённый кэш, распределение задач по агентам в CI, self-healing CI.

### Словарь

|   |   |   |
|---|---|---|
|Термин|Что это|Где живёт|
|Workspace|Корень репозитория с `nx.json`; всё, что Nx видит|`nx.json` в корне|
|Project|Единица графа: приложение, библиотека, e2e-набор. Определяется наличием `project.json` или `package.json` (в workspaces)|папка проекта|
|Target|Именованная операция проекта: `build`, `test`, `lint`, `serve`|`project.json` → `targets`, `package.json` → `scripts` / `nx.targets`, или выводится плагином|
|Task|Конкретный запуск: проект + target + конфигурация, например `myapp:build:production`|существует во время выполнения|
|Configuration|Именованный набор переопределений опций target'а (`production`, `development`)|`targets.<name>.configurations`|
|Executor|Код, который выполняет target (`@nx/vite:build`, `nx:run-commands`). Альтернатива — просто команда|плагин|
|Generator|Код, который создаёт/меняет файлы (`@nx/react:library`)|плагин|
|Plugin|npm-пакет, дающий выводимые задачи (inferred tasks), генераторы, executors, миграции|`nx.json` → `plugins`|
|Project graph|Граф проектов и зависимостей между ними|вычисляется, кэшируется в `.nx/workspace-data`|
|Task graph|Граф задач конкретного запуска с учётом `dependsOn`|вычисляется на каждый запуск|
|Inputs / Outputs|Что влияет на хэш задачи / что задача создаёт и что будет восстановлено из кэша|`inputs`, `outputs`, `namedInputs`|
|Affected|Проекты, затронутые изменениями между `base` и `head`|вычисляется из git|
|Daemon|Фоновый процесс, который держит граф в памяти и следит за файлами|`nx daemon`|

Адресация задач в CLI: `<project>:<target>[:<configuration>]`, например `nx run web:build:production`. Короткая форма — `nx build web` (если `build` не совпадает с именем встроенной команды Nx).

## 2. Быстрый старт

Есть два пути: создать новый воркспейс через `create-nx-workspace` или добавить Nx в существующий репозиторий через `nx init`. Второй путь ничего не ломает: скрипты в `package.json` остаются, появляются только `nx.json` и devDependency `nx`.

### 2.1. Новый воркспейс

```bash
# интерактивно: спросит стек, пакетный менеджер, CI, линтер, форматтер
npx create-nx-workspace@latest myorg

# неинтерактивно: TS-монорепо на pnpm без Nx Cloud
npx create-nx-workspace@latest myorg --preset=ts --pm=pnpm --nxCloud=skip --no-interactive

# готовый React-монорепо с Vite, Vitest и Playwright
npx create-nx-workspace@latest myorg --preset=react-monorepo \
  --bundler=vite --unitTestRunner=vitest --e2eTestRunner=playwright --appName=web
```

Ключевые решения при создании:

- **`--preset`** — стартовое содержимое. `ts` / `apps` — пустой монорепо, `npm` — package-based на workspaces, `*-monorepo` — монорепо с приложением, `*-standalone` — одно приложение в корне. Вместо preset можно взять `--template` (например `nrwl/react-template`).
- **`--workspaces`** (по умолчанию `true`) — использовать workspaces пакетного менеджера. Тогда проекты описываются своими `package.json`, а библиотеки связываются через workspace-протокол, а не через `paths` в tsconfig.
- **`--useProjectJson`** — хранить Nx-конфигурацию проекта в `project.json`, а не в `package.json` (по умолчанию `true` только при `--no-workspaces`).
- **`--nxCloud` / `--ci`** — сразу подключить Nx Cloud и сгенерировать workflow для GitHub/GitLab/Azure/Bitbucket/CircleCI; `skip` — без облака.
- **`--linter`** (`eslint`, `oxlint`, `none`), **`--formatter`** (`prettier`, `oxfmt`, `none`), **`--unitTestRunner`**, **`--e2eTestRunner`** — выбор инструментов; Nx сгенерирует их конфиги и подключит соответствующие плагины.

Полный список флагов — в разделе 7.

### 2.2. Существующий репозиторий

```bash
npx nx@latest init
```

`nx init` определяет структуру репозитория (монорепо на workspaces, одиночный проект, Angular CLI, Gradle/Maven и т.д.), устанавливает `nx`, создаёт `nx.json`, предлагает включить кэширование для выбранных скриптов (`--cacheable=build,test,lint`), установить плагины для найденных инструментов (`--plugins=all|skip|@nx/vite,...`) и подключить Nx Cloud (`--nxCloud`). Для не-JS репозиториев есть `--useDotNxInstallation`: Nx ставится в папку `.nx/` с обёрткой `./nx`, без `package.json` в корне.

Проверка после установки:

```bash
nx run-many -t build   # первый прогон
nx run-many -t build   # второй — «existing outputs match the cache, left as is»
nx graph               # граф проектов в браузере
```

### 2.3. Как вызывать nx

- Через пакетный менеджер: `npx nx …`, `pnpm nx …`, `yarn nx …`, `bunx nx …` — всегда берётся локальная версия из `node_modules`.
- Глобально: `npm i -g nx`. Глобальный бинарь находит локальную установку воркспейса и делегирует ей, так что версии не конфликтуют.
- Через обёртку `./nx` (при `--useDotNxInstallation`).

Далее в гайде команды пишутся как `nx …`.

### 2.4. Окружение разработчика

- **Nx Console** — расширение для VS Code и JetBrains: дерево проектов и задач, формы для генераторов с живым `--dry-run`, граф прямо в IDE.
- **Автодополнение в шелле**: `nx completion` (bash, zsh, fish, powershell).
- **AI-агенты**: `nx configure-ai-agents` настраивает Claude, Codex, Copilot, Cursor, Gemini, OpenCode на работу с воркспейсом (правила + MCP-сервер `nx mcp`).

## 3. Базовые операции: как сделать

Почти вся ежедневная работа — это пять глаголов: `run`, `run-many`, `affected`, `generate`, `show`/`graph`. Ниже — рецепты; полные списки флагов в разделе 7.

### 3.1. Запустить задачу одного проекта

```bash
nx build web                         # = nx run web:build
nx run web:build:production          # с конфигурацией
nx build web -c production           # то же через флаг
nx test api --watch                  # неизвестные Nx флаги передаются в инструмент
nx build web --skipNxCache           # игнорировать кэш
nx build web --excludeTaskDependencies  # не собирать сначала зависимости
nx run web:"build:test"              # target с двоеточием в имени
```

Флаги, которые Nx не распознал как свои, становятся опциями target'а: для executor'а — переопределяют `options`, для команды — дописываются в конец командной строки. Если нужно передать флаг, совпадающий с флагом Nx, ставьте `--`: `nx test api -- --verbose`.

### 3.2. Запустить задачу во многих проектах

```bash
nx run-many -t build                       # все проекты, у которых есть build
nx run-many -t lint test build             # несколько target'ов разом
nx run-many -t test -p api web             # конкретные проекты
nx run-many -t test -p 'tag:scope:shared'  # по тэгу
nx run-many -t test -p '*-app' --exclude legacy-app   # по glob
nx run-many -t build -p 'packages/*'       # по папке
nx run-many -t test -p '!*-e2e'            # отрицание
nx run-many -t build --parallel=8          # до 8 задач одновременно (по умолчанию 3)
nx run-many -t build --nxBail              # остановиться после первой ошибки
```

Проверить, какие проекты попадут под шаблон, можно без запуска: `nx show projects -p 'tag:scope:shared'`.

### 3.3. Запустить только затронутое (affected)

```bash
nx affected -t lint test build                         # base/head из nx.json (defaultBase) и HEAD
nx affected -t test --base=origin/main --head=HEAD     # явно для PR
nx affected -t test --uncommitted                      # только незакоммиченные изменения
nx affected -t test --files=libs/ui/src/button.tsx     # «представим, что изменился этот файл»
nx affected -t build --explain                         # почему каждая задача считается затронутой
nx show projects --affected --type app                 # просто список затронутых приложений
nx graph --affected                                    # подсветить затронутое на графе
```

### 3.4. Посмотреть, что происходит

```bash
nx graph                                # граф проектов в браузере
nx graph --focus=web                    # только предки и потомки web
nx run-many -t build --graph            # граф задач, которые будут запущены (без запуска)
nx show projects                        # все проекты
nx show projects --withTarget serve     # проекты с target'ом serve
nx show project web                     # итоговая конфигурация проекта (в т.ч. выведенные плагинами задачи)
nx show project web --json | jq '.targets.build'
nx show target web:build                # итоговая конфигурация target'а (Nx 22.6+)
nx show target inputs web:build         # какие файлы/env участвуют в хэше
nx show target inputs web:build --check apps/web/index.html
nx show target outputs web:build        # что будет закэшировано
```

### 3.5. Сгенерировать код

```bash
nx g @nx/react:app apps/web --bundler=vite      # приложение
nx g @nx/js:lib packages/utils                  # TS-библиотека
nx g @nx/react:component packages/ui/src/button # компонент
nx g @nx/js:lib packages/utils --dry-run        # предпросмотр без записи файлов
nx g @nx/react:lib --help                       # опции генератора
nx list @nx/react                               # какие генераторы и executors есть в плагине
nx g @nx/workspace:move --project=utils --destination=packages/shared/utils   # перенести проект
nx g @nx/workspace:remove utils                  # удалить проект
```

Позиционный аргумент у генераторов проектов — это **путь** (directory), имя выводится из него или задаётся `--name`. Генераторы по умолчанию интерактивны; для скриптов и CI — `--no-interactive`.

### 3.6. Добавить плагин / технологию

```bash
nx add @nx/vite        # установит @nx/vite той же версии, что nx, и запустит его init-генератор
nx add @nx/playwright
nx add @nx/gradle      # не только JS: Gradle, Maven, .NET
```

`init`-генератор регистрирует плагин в `nx.json → plugins`; после этого задачи для всех `vite.config.*` в репозитории появляются автоматически.

### 3.7. Обновить Nx

```bash
nx migrate latest                   # обновит версии в package.json и создаст migrations.json
npm install                         # (или pnpm/yarn) поставить новые версии
nx migrate --run-migrations         # применить миграции кода и конфигов
nx migrate --run-migrations --create-commits  # по коммиту на миграцию
rm migrations.json                  # после проверки
```

При прыжке через несколько мажорных версий Nx предложит идти поэтапно (`--multiMajorMode=gradual`). Если когда-то обновлялись в обход `nx migrate`, запустите `nx repair`.

### 3.8. Прочее полезное

- `nx format:write` / `nx format:check` — Prettier (или oxfmt) по изменённым или всем файлам.
- `nx watch -p utils -d -- nx build utils` — пересобирать при изменениях проекта и его зависимостей; в команде доступны `$NX_PROJECT_NAME` и `$NX_FILE_CHANGES`.
- `nx import ../other-repo libs/other` — перенести другой репозиторий вместе с git-историей.
- `nx reset` — сбросить кэш, данные воркспейса и перезапустить daemon (лечит большинство «странных» ошибок).
- `nx report` — версии всех пакетов Nx для баг-репорта.

## 4. Как это работает

Любая команда запуска проходит один и тот же конвейер: граф проектов → итоговая конфигурация target'ов → граф задач → хэш каждой задачи → кэш или выполнение. Понимание этих шагов объясняет почти любое «почему Nx сделал/не сделал X».

[embed: node/f8f5fd86-da5a]

Шаги 1–3 одинаковы для любой команды; на шаге 4 решается, будет ли инструмент запущен вообще.

### 4.1. Граф проектов

**Обнаружение проектов.** Nx сканирует файлы воркспейса (с учётом `.gitignore` и `.nxignore`) и считает проектом каждую папку с `project.json` или с `package.json`, входящим в workspaces пакетного менеджера (`workspaces` в корневом `package.json`, `pnpm-workspace.yaml`). Плагины могут объявлять проекты и по другим файлам — например `@nx/gradle` по `build.gradle.kts`, `@nx/dotnet` по `.csproj`.

**Зависимости.** Рёбра графа Nx вычисляет сам: разбирает `import`/`require` в исходниках, зависимости в `package.json`, пути в tsconfig, а плагины для других языков добавляют свои источники. Ручная правка нужна редко — через `implicitDependencies` (добавить ребро, которое нельзя вывести статически, или убрать лишнее через `!name`). Внешние npm-пакеты тоже попадают в граф как узлы `npm:react` и т.п. — по ним считается влияние обновления зависимостей.

**Плагины и API.** Плагин реализует `createNodes` (по glob-шаблону своих конфиг-файлов возвращает проекты и их target'ы) и опционально `createDependencies` (дополнительные рёбра) и `createMetadata`. Именно так появляются «выведенные задачи» (inferred tasks): `@nx/vite` находит `vite.config.ts` и создаёт `build`, `serve`, `preview`, `test` с правильными `inputs`, `outputs` и `dependsOn`.

**Кэш графа и daemon.** Граф и промежуточные результаты плагинов хранятся в `.nx/workspace-data`. Локально работает **Nx Daemon** — фоновый процесс на воркспейс, который следит за файлами и пересчитывает граф инкрементально, поэтому повторные команды стартуют мгновенно. В CI и контейнерах daemon по умолчанию выключен; управлять можно через `NX_DAEMON=true|false` или `useDaemonProcess` в `nx.json`. Daemon сам завершается после 3 часов простоя; `nx daemon` покажет PID и путь к логу.

### 4.2. Итоговая конфигурация target'а

Конфигурация каждого target'а собирается из трёх слоёв, каждый следующий перезаписывает предыдущий:

1. Задачи, выведенные плагинами из `nx.json → plugins` (если два плагина создали target с одним именем, побеждает тот, что ниже в массиве).
2. `targetDefaults` из `nx.json` (по имени target'а, glob-шаблону или executor'у; можно сузить фильтром по плагину/проектам/executor'у).
3. Конфигурация проекта в `project.json` или `package.json → nx` (а также `scripts`).

По умолчанию значение заменяется целиком. Чтобы **дополнить**, а не заменить, используется spread-токен `"..."`: `"inputs": ["...", "{workspaceRoot}/babel.config.json"]` или `"options": {"...": true, "assetsDir": "static"}`. `tags` и `implicitDependencies` всегда объединяются между слоями. Увидеть результат и источник каждого поля: `nx show project <name> --web` или `nx show target <project>:<target>`.

### 4.3. Граф задач и порядок выполнения

Команда (`nx build web`, `run-many`, `affected`) порождает набор запрошенных задач, а `dependsOn` достраивает граф задач:

- `"build"` — сначала target `build` этого же проекта;
- `"^build"` — сначала `build` у всех проектов, от которых зависит текущий (по графу проектов);
- `{"projects": ["api"], "target": "serve"}` — конкретный target конкретного проекта;
- шаблоны `"build-*"`, `"^build-*"`; `"params": "forward"` — пробросить CLI-аргументы в зависимую задачу.

Граф задач не повторяет граф проектов: если у `test` нет `dependsOn`, тесты `app` и `lib` пойдут параллельно, хотя `app` импортирует `lib`. Nx запускает задачи в топологическом порядке, до `--parallel` штук одновременно (по умолчанию 3). Дополнительные регуляторы:

- `"continuous": true` — задача никогда не завершается (dev-сервер); зависимые от неё стартуют, не дожидаясь выхода. Типичный пример — `e2e` зависит от `serve`.
- `"parallelism": false` — задача не идёт параллельно с другими на этой машине (общий порт, тяжёлая память).
- `--batch` — executors, поддерживающие batch-режим (например `@nx/js:tsc`), обрабатывают много проектов одним процессом.
- **Sync-генераторы** (`syncGenerators` у target'а, `sync.globalGenerators` в `nx.json`) перед запуском задачи приводят файлы в соответствие с графом — например, `@nx/js` обновляет `references` в tsconfig. Проверка в CI: `nx sync:check`.

### 4.4. Хэширование

Перед запуском кэшируемой задачи (`"cache": true`) Nx вычисляет её хэш из **inputs**:

- файлы проекта (по умолчанию все в корне проекта) и, через `^`, файлы проектов-зависимостей;
- конфигурация проекта и его зависимостей, релевантная часть корневого `tsconfig.base.json`;
- версии внешних зависимостей (все из lock-файла, если не сужено через `externalDependencies`);
- аргументы командной строки, относящиеся к задаче (`nx build web --sourcemap` и `nx build web` — разные хэши; `--parallel`, `-p` в хэш не входят);
- окружение и рантайм: `{"env": "API_URL"}`, `{"runtime": "node --version"}`, ОС и архитектура;
- при необходимости — выходы зависимых задач (`dependentTasksOutputFiles`) и входы continuous-зависимостей.

Одна и та же задача, вызванная разными командами (`nx build web` и `nx run-many -t build -p web`), даёт одинаковый хэш. Посмотреть фактические входы: `nx show target inputs web:build`.

### 4.5. Кэш

После вычисления хэша Nx ищет запись в локальном кэше, затем в удалённом (если он настроен). При попадании восстанавливаются файлы из `outputs` и проигрывается сохранённый вывод терминала — со стороны это неотличимо от реального запуска, только быстрее. При промахе задача выполняется, а её вывод и `outputs` сохраняются локально и, если есть права записи, в удалённый кэш.

- **Где лежит**: в Nx 23 по умолчанию `~/.nx/<id>/cache` — общий для всех клонов одного воркспейса на машине; меняется через `cacheDirectory`.
- **Размер**: по умолчанию до 10% диска, но не больше 10 ГБ (`maxCacheSize`, `NX_MAX_CACHE_SIZE`); записи, к которым не обращались 7 дней, удаляются всегда.
- **Что кэшируется**: только то, что перечислено в `outputs` (или выведено плагином). Если `outputs` не задан, для `build`/`prepare` Nx пробует `dist`, `build`, `public`. Файлы вне `outputs` не восстанавливаются — частая причина «после кэша нет артефакта».
- **Обход кэша**: `--skipNxCache`, `--skipRemoteCache`; очистка — `nx reset --onlyCache`.

### 4.6. Affected

`nx affected` берёт изменённые файлы из git между `--base` (по умолчанию `defaultBase`, обычно `main`) и `--head` (по умолчанию — рабочая копия), сопоставляет их с проектами, добавляет все проекты, которые от них зависят, и запускает target для этого набора — по сути `run-many` с вычисленным `-p`. Нюансы:

- Плагины анализируют характер изменения: правка версии пакета в `package.json` затронет только те проекты, что этот пакет используют.
- Изменение lock-файла по умолчанию затрагивает **все** проекты; `pluginsConfig.@nx/js.projectsAffectedByDependencyUpdates: "auto"` сужает это до проектов, чьи зависимости реально поменялись.
- **Task-based affected** (Nx 23.3): с `NX_LEGACY_AFFECTED=false` Nx отбирает не целые проекты, а отдельные задачи — по тому, задевает ли изменение их `inputs`. Правка одного spec-файла запустит `test` только этого проекта, а не всех зависимых. Флаг `--explain` в этом режиме печатает причину для каждой задачи. Требует аккуратно описанных `inputs`/`outputs`.
- В CI `base` должен указывать на последний **успешный** коммит `main` (GitHub: `nrwl/nx-set-shas`, CircleCI: Nx Orb, иначе `NX_BASE`/`NX_HEAD`).

### 4.7. Распределённое выполнение

С Nx Cloud граф задач можно раздать нескольким машинам-агентам (Nx Agents или свои агенты). Координатор раздаёт задачи по графу, агенты обмениваются артефактами через удалённый кэш, а основной job получает логи и файлы так, будто всё выполнялось локально. Поэтому для распределения target обязан быть кэшируемым. Подробнее — раздел 9.

## 5. Конфигурация

У Nx два уровня конфигурации: `nx.json` в корне (поведение CLI, плагины, умолчания для всех проектов) и конфигурация проекта в `project.json` или в поле `nx` его `package.json`. Всё, что можно вывести из конфигов инструментов, плагины выводят сами — руками пишутся только отличия.

### 5.1. Типичная структура воркспейса

```text
myorg/
├── nx.json                  # конфигурация Nx
├── package.json             # корневые devDependencies + "workspaces"
├── pnpm-workspace.yaml      # (для pnpm) список пакетов
├── tsconfig.base.json       # общие compilerOptions
├── tsconfig.json            # корневой solution-файл с references (TS project references)
├── eslint.config.mjs        # корневой ESLint
├── .nxignore                # что Nx не должен видеть (синтаксис .gitignore)
├── .nx/workspace-data/      # кэш графа (в .gitignore)
├── apps/
│   └── web/
│       ├── package.json     # имя проекта, зависимости, "nx": {...}
│       ├── vite.config.ts   # из него @nx/vite выводит build/serve/test
│       └── tsconfig*.json
└── packages/
    └── ui/
        ├── package.json
        └── project.json     # (альтернатива полю "nx" в package.json)
```

### 5.2. nx.json: основные поля

```jsonc
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",                // база для affected
  "parallel": 4,                         // макс. параллельных задач
  "plugins": [
    { "plugin": "@nx/js/typescript", "options": { "typecheck": { "targetName": "typecheck" }, "build": { "targetName": "build" } } },
    { "plugin": "@nx/vite/plugin", "options": { "buildTargetName": "build", "testTargetName": "test" } },
    { "plugin": "@nx/eslint/plugin", "options": { "targetName": "lint" } },
    { "plugin": "@nx/playwright/plugin", "include": ["apps/*-e2e/**/*"] }
  ],
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/eslint.config.mjs"],
    "sharedGlobals": ["{workspaceRoot}/.github/workflows/ci.yml", { "runtime": "node --version" }]
  },
  "targetDefaults": {
    "build": { "dependsOn": ["^build"], "inputs": ["production", "^production"], "cache": true },
    "test":  { "inputs": ["default", "^production"], "cache": true },
    "lint":  { "cache": true },
    "e2e-ci--**/**": { "options": { "headless": true } }
  },
  "generators": { "@nx/js:library": { "bundler": "tsc", "unitTestRunner": "vitest" } },
  "release": { "projectsRelationship": "independent", "version": { "conventionalCommits": true } },
  "sync": { "applyChanges": true },
  "tui": { "enabled": true, "autoExit": true },
  "nxCloudId": "…"
}
```

|   |   |   |
|---|---|---|
|Поле|Назначение|По умолчанию / заметки|
|`plugins`|Плагины, выводящие проекты и задачи. Строка или `{plugin, options, include, exclude}`|Порядок важен: при совпадении имён target'а побеждает последний плагин|
|`pluginsConfig`|Общие настройки плагина, например `@nx/js.projectsAffectedByDependencyUpdates`|`all` / `auto` / список проектов|
|`namedInputs`|Именованные наборы входов для хэша|Обычно `default`, `production`, `sharedGlobals`|
|`targetDefaults`|Умолчания для target'ов по имени, glob или executor'у; объект или массив записей с `filter` (`plugin`, `projects`, `executor`)|Ключ по executor'у приоритетнее ключа по имени|
|`defaultBase`|Базовая ветка для `affected`|`main`|
|`parallel`|Макс. одновременных задач|3|
|`cacheDirectory`|Где лежит локальный кэш|`~/.nx/<id>/cache`|
|`maxCacheSize`|Лимит локального кэша (`100MB`, `10GB`, `0` — без лимита)|10% диска, не более 10 ГБ|
|`useDaemonProcess`|Включить/выключить daemon|включён локально, выключен в CI|
|`generators`|Значения по умолчанию для опций генераторов|—|
|`release`|Конфигурация `nx release` (раздел 8)|работает и без неё|
|`sync`|`applyChanges`, `globalGenerators`, `generatorOptions`, `disabledTaskSyncGenerators`|без `applyChanges` Nx спрашивает|
|`migrate`|Умолчания для `nx migrate`: `createCommits`, `commitPrefix`, `multiMajorMode`, `agentic`|флаги CLI главнее|
|`tui`|`enabled`, `autoExit` для терминального UI|—|
|`nxCloudId` / `nxCloudUrl` / `nxCloudEncryptionKey`|Подключение к Nx Cloud и E2E-шифрование кэша|—|
|`extends`|Унаследовать пресет из `node_modules` (например `nx/presets/npm.json`)|—|
|`conformance`|Правила Nx Conformance (Enterprise)|—|
|`analytics`|Телеметрия|спрашивает при первом запуске|

**Сужение плагина** до части репозитория — `include`/`exclude` с glob'ами по пути конфиг-файла (поддерживаются отрицания `!`). Так можно, например, держать Jest на старых пакетах и Vitest на новых.

### 5.3. Конфигурация проекта

Одинаковые возможности доступны в двух формах: поле `"nx"` в `package.json` или отдельный `project.json`. Выбор — дело вкуса; если оба файла есть, Nx их сливает.

```jsonc
// packages/ui/project.json
{
  "name": "ui",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/ui/src",
  "projectType": "library",
  "tags": ["scope:shared", "type:ui"],
  "implicitDependencies": ["design-tokens"],
  "namedInputs": { "production": ["default", "!{projectRoot}/**/*.stories.tsx"] },
  "targets": {
    "build": {
      "outputs": ["{projectRoot}/dist"],
      "options": { "...": true, "sourcemap": true },
      "configurations": { "production": { "sourcemap": false } },
      "defaultConfiguration": "production"
    },
    "generate-icons": {
      "command": "node scripts/icons.mjs",
      "options": { "cwd": "{projectRoot}" },
      "inputs": ["{projectRoot}/icons/**/*.svg"],
      "outputs": ["{projectRoot}/src/icons"],
      "cache": true
    },
    "storybook": { "continuous": true }
  }
}
```

Поля проекта:

|   |   |
|---|---|
|Поле|Что задаёт|
|`name`|Имя проекта (для package.json-проектов берётся из `name` пакета)|
|`root` / `sourceRoot`|Корень проекта и папка исходников (root обычно выводится из расположения файла)|
|`projectType`|`application` или `library` (влияет на `nx show projects --type`)|
|`tags`|Метки для фильтров (`-p tag:…`) и правил границ модулей|
|`implicitDependencies`|Ручные рёбра графа; `!name` убирает выведенное ребро; поддерживаются glob'ы|
|`namedInputs`|Переопределение именованных входов для этого проекта|
|`targets`|Задачи (см. ниже)|
|`metadata`|Произвольные данные, например `description`|
|`release`|Переопределения `nx release` для проекта (например Docker-репозиторий)|
|`includedScripts`|(только в `package.json → nx`) какие npm-скрипты считать target'ами|

Поля target'а:

|   |   |
|---|---|
|Поле|Что задаёт|
|`executor`|Плагинный executor, например `@nx/js:tsc`, `@nx/vite:build`; `nx:run-commands` для команд|
|`command`|Сокращение для `nx:run-commands`: одна shell-команда|
|`options`|Опции executor'а/команды; токены `{projectRoot}`, `{workspaceRoot}`, `{projectName}`|
|`configurations` / `defaultConfiguration`|Именованные наборы переопределений и какой брать по умолчанию|
|`dependsOn`|Задачи, которые должны выполниться раньше (`build`, `^build`, объектная форма с `projects`/`dependencies`/`params`, шаблоны)|
|`inputs`|Что входит в хэш (раздел 5.4)|
|`outputs`|Что кэшировать и восстанавливать; поддерживаются glob'ы и `{options.outputPath}`|
|`cache`|Разрешить кэширование|
|`continuous`|Долгоживущая задача (dev-сервер)|
|`parallelism`|`false` — не запускать параллельно с другими на одной машине|
|`syncGenerators`|Генераторы, приводящие файлы в порядок перед запуском|
|`metadata`|Описание, технологии (показывается в Nx Console и `nx show project`)|

Основные опции `nx:run-commands`: `command` / `commands` (массив), `parallel` (запускать `commands` параллельно, по умолчанию `true`), `cwd`, `env`, `envFile`, `args`, `forwardAllArgs`, `readyWhen` (строка в выводе, после которой задача считается готовой), `color`, `tty`. Аргументы командной строки можно подставлять через `{args.name}`.

### 5.4. Inputs: синтаксис

|   |   |
|---|---|
|Запись|Значение|
|`"{projectRoot}/**/*"`|Файлы проекта по glob; путь обязан начинаться с `{projectRoot}` или `{workspaceRoot}`|
|`"!{projectRoot}/**/*.spec.ts"`|Исключение|
|`"^{projectRoot}/**/*.ts"`|Те же файлы, но в проектах-зависимостях|
|`"production"` / `"^production"`|Именованный вход этого проекта / всех зависимостей|
|`{"input": "production", "projects": ["lib"]}`|Именованный вход конкретных проектов|
|`{"fileset": "…", "includeIgnored": true}`|Включить файлы, игнорируемые git (сгенерированные)|
|`{"json": "{projectRoot}/package.json", "fields": ["dependencies"]}`|Хэшировать только часть JSON (`fields` / `excludeFields`)|
|`{"env": "API_URL"}`|Значение переменной окружения|
|`{"runtime": "node --version"}`|Вывод команды|
|`{"externalDependencies": ["vite"]}`|Версии конкретных npm-пакетов вместо «всех из lock-файла»|
|`{"dependentTasksOutputFiles": "**/*.d.ts", "transitive": true}`|Выходы задач из `dependsOn`|
|`{"workingDirectory": "relative"}`|Каталог запуска|

Общее правило: **inputs должны быть полными** (иначе — ложные попадания в кэш, самый опасный класс ошибок), а **outputs — точными** (иначе артефакты не восстановятся). Начинайте с широкого `default` и сужайте, когда видите лишние промахи.

### 5.5. Границы модулей

Тэги проекта + правило линтера превращают архитектурные договорённости в проверку. Для JS/TS — правило `@nx/enforce-module-boundaries` (ESLint или, экспериментально, Oxlint):

```js
// eslint.config.mjs
import nx from '@nx/eslint-plugin';
export default [
  ...nx.configs['flat/base'], ...nx.configs['flat/typescript'],
  { files: ['**/*.ts', '**/*.tsx'], rules: {
    '@nx/enforce-module-boundaries': ['error', {
      allow: [],
      depConstraints: [
        { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
        { sourceTag: 'scope:admin',  onlyDependOnLibsWithTags: ['scope:shared', 'scope:admin'] },
        { sourceTag: 'type:app',     onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:util'] },
      ],
    }],
  }},
];
```

Тэги в ограничениях: точная строка, `*`, glob вида `scope:*`, регулярное выражение `/^scope.*/`. Проекты без тэгов не могут зависеть ни от кого, если нет правила `sourceTag: '*'`. Для не-JS проектов то же самое делает правило Conformance `enforce-project-boundaries` (Nx Enterprise).

### 5.6. Прочие файлы и переменные

- `.nxignore` — исключить файлы из графа, affected и хэшей (синтаксис `.gitignore`).
- `NX_BASE` / `NX_HEAD` — base и head для affected без флагов.
- `NX_DAEMON`, `NX_SKIP_NX_CACHE`, `NX_MAX_CACHE_SIZE`, `NX_VERBOSE_LOGGING`, `NX_TUI`, `NX_LEGACY_AFFECTED`, `NX_SOCKET_DIR` — переключатели поведения.
- `NX_CLOUD_ACCESS_TOKEN` — токен Nx Cloud для CI (права на чтение/запись кэша).
- Внутри задач Nx выставляет `NX_TASK_TARGET_PROJECT`, `NX_TASK_TARGET_TARGET`, `NX_TASK_TARGET_CONFIGURATION` и подгружает `.env`-файлы проекта и воркспейса (`.env`, `.env.local`, `.env.<target>`, `.env.<configuration>`).

## 6. Как инструменты сочетаются: зоны ответственности

Nx — слой оркестрации над вашими инструментами, а не их замена. Он решает, **что запускать, в каком порядке, параллельно ли и можно ли взять результат из кэша**; сами сборка, проверка типов, тесты, линт и установка пакетов остаются за профильными инструментами. Плагины Nx — это переходники: читают конфиги инструментов и описывают для Nx, как их запускать.

[embed: node/041d26bf-d0ca]

Стрелки показывают, кто кого вызывает: вы обращаетесь к Nx, Nx через плагины запускает инструменты, а сами инструменты о Nx ничего не знают.

|   |   |   |   |
|---|---|---|---|
|Инструмент|Отвечает за|Не отвечает за|Точка стыка с Nx|
|**Nx (ядро)**|Граф проектов, граф задач, порядок, параллелизм, хэши и кэш, affected, генераторы, миграции, `nx release`|Компиляцию, бандлинг, тесты, установку пакетов|`nx.json`, `project.json` / `package.json → nx`|
|**Плагины `@nx/*`**|Вывод задач из конфигов (inferred tasks), генераторы, executors, миграции под конкретный инструмент|Логику самого инструмента|`nx.json → plugins`; `nx add`|
|**Пакетный менеджер** (npm, pnpm, yarn, bun)|Установка зависимостей, lock-файл, связывание локальных пакетов через workspaces (`workspace:*`), запуск бинарей|Порядок задач, кэш, affected|Nx читает workspaces для обнаружения проектов и lock-файл для внешних узлов графа и хэшей|
|**TypeScript** (`tsc`)|Проверка типов, emit `.d.ts`/JS, инкрементальность через project references и `.tsbuildinfo`|Какие проекты пересобирать и в каком порядке|`@nx/js/typescript` выводит `typecheck`/`build`; sync-генератор поддерживает `references` в tsconfig по графу|
|**Бандлер** (Vite, Rspack, webpack, esbuild, Rollup, Next.js)|Сборка приложения/библиотеки, dev-сервер, HMR|Сборку зависимостей других проектов, кэш между запусками|Плагин выводит `build`/`serve`/`preview` с `outputs`; dev-сервер помечается `continuous`|
|**Тест-раннер** (Vitest, Jest, Playwright, Cypress)|Запуск тестов, watch-режим, покрытие|Выбор затронутых проектов, кэш результатов|Плагин выводит `test`/`e2e`; для e2e — атомизация на `e2e-ci--<file>` для распределения|
|**Линтер / форматтер** (ESLint, Oxlint, Prettier, oxfmt)|Правила кода, форматирование|Границы между проектами (кроме правила Nx)|`@nx/eslint` выводит `lint`; `@nx/enforce-module-boundaries` читает граф Nx; `nx format` обёртка над Prettier/oxfmt|
|**Git**|История, диффы|—|Источник изменённых файлов для affected и `nx release` (теги, коммиты)|
|**CI** (GitHub Actions, GitLab, …)|Триггеры, машины, секреты, кэш `node_modules`|Какие задачи запускать (это решает `nx affected`)|`nx affected -t …`, `nrwl/nx-set-shas`, `nx sync:check`, `nx format:check`|
|**Nx Cloud** (опционально)|Удалённый кэш, распределение задач по агентам, self-healing CI, аналитика запусков|Сами вычисления|`nxCloudId` в `nx.json`, `nx connect`, `nx start-ci-run`|
|**Nx Console**|UI в IDE: проекты, задачи, генераторы, граф|—|Читает тот же граф через daemon|

### 6.1. Nx и пакетный менеджер

Современная раскладка — **workspaces + package.json на каждый проект**. Пакетный менеджер связывает локальные пакеты симлинками в `node_modules` (`"@myorg/ui": "workspace:*"`), поэтому импорт `@myorg/ui` резолвится так же, как в опубликованном пакете. Nx в этот механизм не вмешивается: он лишь читает workspaces, чтобы найти проекты, и lock-файл, чтобы учитывать версии внешних пакетов в графе и хэшах. Скрипты из `package.json` автоматически становятся target'ами Nx — `npm run build` и `nx build` вызывают одну и ту же команду, но второй добавляет кэш и `dependsOn`.

### 6.2. Nx и TypeScript

Есть две модели связывания библиотек:

- **Workspaces + project references** (по умолчанию с Nx 20): каждый проект — пакет со своим `tsconfig.json`, где `references` указывают на зависимости. `tsc -b` строит проекты инкрементально и переиспользует `.tsbuildinfo`. Поддерживать `references` вручную не нужно: sync-генератор `@nx/js:typescript-sync` выставляет их по графу Nx перед каждой задачей или по `nx sync`. Если файлы рассинхронизированы, Nx скажет «The workspace is out of sync».
- **Path aliases** (`compilerOptions.paths` в `tsconfig.base.json`): старая модель интегрированного монорепо — все библиотеки компилируются в составе потребителя, отдельный build у библиотеки не обязателен. Остаётся рабочей, есть руководство по переходу на workspaces и references.

Зоны ответственности: TypeScript проверяет типы и выпускает файлы; Nx решает, для каких проектов запускать `typecheck`/`build`, в каком порядке, и кэширует результат каждого проекта отдельно.

### 6.3. Nx и бандлеры, тест-раннеры, линтеры

Конфиги инструментов остаются **их собственными** (`vite.config.ts`, `jest.config.ts`, `eslint.config.mjs`, `playwright.config.ts`) и работают без Nx. Плагин лишь сообщает Nx, какие задачи из них получаются и какие у них входы/выходы. Поэтому:

- чтобы поменять поведение сборки — правьте конфиг инструмента;
- чтобы поменять поведение оркестрации (кэш, inputs, outputs, dependsOn, имя target'а) — правьте `nx.json` (опции плагина или `targetDefaults`) или конфигурацию проекта;
- опции, переданные через CLI или `options` target'а, Nx передаёт инструменту как флаги командной строки.

Старый подход — executors (`@nx/vite:build`, `@nx/jest:jest`) с опциями в `project.json` — по-прежнему поддерживается, но новые воркспейсы используют выведенные задачи. Перевод: `nx g @nx/<plugin>:convert-to-inferred`.

### 6.4. Nx и CI, Nx Cloud

CI-провайдер выделяет машины и запускает пайплайн; Nx внутри решает, какие задачи нужны (`affected`), и берёт готовые результаты из кэша. Без Nx Cloud кэш только локальный (можно хранить `.nx`-кэш артефактом CI, но это хрупко; есть и самостоятельные реализации удалённого кэша через API `RemoteCache`). С Nx Cloud добавляются общий удалённый кэш для разработчиков и CI, распределение задач по агентам и автоматические исправления упавших задач. Подробно — раздел 9.

### 6.5. Чем Nx отличается от «соседей»

- **Turborepo** — тоже оркестратор задач с кэшем, но без плагинной модели вывода задач, генераторов и миграций.
- **Lerna** — исторически инструмент версионирования и публикации; современная Lerna использует Nx как движок запуска задач. В Nx эту роль закрывает `nx release`.
- **Changesets** — версионирование и changelog по файлам-заявкам; аналог в Nx — version plans (`nx release plan`).
- **Bazel** — герметичные сборки с явным описанием всех правил; Nx жертвует герметичностью ради того, чтобы работать с существующими инструментами без переписывания конфигов.

## 7. Справочник CLI

Справочник сверен с [официальной страницей команд Nx 23](https://nx.dev/docs/reference/nx-commands). Флаги пишутся как в camelCase (`--skipNxCache`), так и в kebab-case (`--skip-nx-cache`); булевы флаги отрицаются через `--no-` (`--no-interactive`). Любая команда поддерживает `--help` и `--version`; у большинства есть `--verbose` (стек-трейсы и подробный лог). Для конкретного генератора или executor'а: `nx g <plugin>:<gen> --help`, `nx list <plugin>`.

### 7.1. Запуск задач: run, run-many, affected

```text
nx run <project>:<target>[:<configuration>] [опции target'а]
nx <target> <project> [опции]                # инфиксная форма
nx run-many -t <targets…> [-p <проекты/шаблоны>]
nx affected -t <targets…> [--base … --head …]
```

Общие опции всех трёх команд:

|   |   |   |
|---|---|---|
|Опция|Что делает|По умолчанию|
|`-t`, `--targets`, `--target`|Target'ы для запуска (через пробел или запятую). В `nx run` — способ указать target с `:` в имени|—|
|`-c`, `--configuration`|Конфигурация target'а|`defaultConfiguration`|
|`--parallel`|Макс. параллельных задач; `--parallel=false` — последовательно|3 (или `parallel` из `nx.json`)|
|`--exclude`|Исключить проекты (имена, glob, `tag:`)|—|
|`--excludeTaskDependencies`|Не запускать задачи из `dependsOn`|`false`|
|`--nxBail`|Остановиться после первой упавшей задачи|`false`|
|`--nxIgnoreCycles`|Игнорировать циклы в графе задач|`false`|
|`--skipNxCache`, `--disableNxCache`|Выполнить, даже если результат есть в кэше|`false`|
|`--skipRemoteCache`, `--disableRemoteCache`|Не использовать удалённый кэш|`false`|
|`--skipSync`|Не запускать sync-генераторы задач|`false`|
|`--batch`|Batch-режим для executors, которые его поддерживают|—|
|`--graph`|Показать граф задач вместо запуска: без значения — в браузере, `--graph=out.json` — в файл, `--graph=stdout` — в терминал|—|
|`--outputStyle`|Формат вывода (см. ниже)|`tui` локально, `static-failures-only` в CI, `summary` под AI-агентом|
|`--tui` / `--no-tui`|Включить/выключить терминальный UI|—|
|`--tuiAutoExit`|Выйти из TUI после завершения: `true`, `false` или число секунд|—|
|`--runner`|Имя task runner'а из `nx.json` (legacy)|—|

Значения `--outputStyle`: `tui` — интерактивный терминальный UI; `dynamic` / `dynamic-legacy` — перерисовывающийся вывод без TUI; `static` — полный вывод каждой задачи последовательно; `static-failures-only` — успешные и кэшированные задачи в одну строку, подробно только упавшие; `summary` — только счётчики и путь к логу каждой упавшей задачи; `stream` — потоковый вывод всех задач с префиксом проекта; `stream-without-prefixes` — то же без префикса.

Специфичные опции:

|   |   |   |
|---|---|---|
|Команда|Опция|Что делает|
|`run`|`-p`, `--project`|Проект (альтернатива позиционной записи)|
|`run-many`|`-p`, `--projects`|Проекты: имена, glob (`*-app`), папки (`packages/*`), тэги (`tag:scope:ui`), отрицания (`!*-e2e`); без `-p` — все проекты с таким target'ом|
|`run-many`|`--all`|Устарел: «все проекты» и так поведение по умолчанию|
|`affected`|`--base` / `--head`|Коммиты для сравнения (по умолчанию `defaultBase` и рабочая копия; также `NX_BASE`/`NX_HEAD`)|
|`affected`|`--files`|Явный список изменённых файлов вместо git|
|`affected`|`--stdin`|Читать изменённые файлы из stdin, по одному на строку|
|`affected`|`--uncommitted` / `--untracked`|Учитывать только незакоммиченные / неотслеживаемые изменения|
|`affected`|`--explain`|Объяснить, почему задача затронута, без запуска; `--explain=stdout` или `--explain=file.json` — в JSON (нужен `NX_LEGACY_AFFECTED=false`)|
|`affected`|`--all`|Устарел: используйте `run-many`|

### 7.2. Генерация кода и плагины

|   |   |   |
|---|---|---|
|Команда|Назначение|Опции|
|`nx generate <plugin>:<generator> [args]`, `nx g`|Запустить генератор|`--dryRun` (`-d`) — показать изменения без записи; `--interactive` (по умолчанию `true`); `--defaults` — не спрашивать опции, у которых есть значения по умолчанию; `--force` — перезаписывать файлы; `--quiet` — без логов Nx; плюс опции самого генератора (см. `--help`)|
|`nx add <package>[@version]`|Установить плагин и выполнить его `init`-генератор. Для `@nx/*` берётся версия, совпадающая с `nx`|`--updatePackageScripts` — заменить скрипты `package.json` на выведенные target'ы (по умолчанию `true` для core-плагинов)|
|`nx list [plugin]`|Установленные плагины, их генераторы и executors; без аргумента — ещё и доступные к установке|`--json`|

### 7.3. Исследование воркспейса

|   |   |   |
|---|---|---|
|Команда|Назначение|Опции|
|`nx graph`|Граф проектов или задач в браузере / в файл|`--focus=<proj>` — только предки и потомки; `--exclude`; `--groupByFolder`; `--view` — `projects` (по умолчанию) или `tasks`; `--targets` — target для графа задач; `--affected` + `--base`, `--head`, `--files`, `--stdin`, `--uncommitted`, `--untracked` — подсветить затронутое; `--file=out.json` или `--file=out.html` — сохранить; `--print` — JSON в stdout; `--watch` (по умолчанию `true`), `--open` (по умолчанию `true`), `--host`, `--port`|
|`nx show projects`|Список проектов|`-p` — фильтр шаблоном; `--exclude`; `-t`, `--withTarget` — только с этим target'ом; `--type` — `app`, `lib` или `e2e`; `--affected` + `--base`, `--head`, `--files`, `--stdin`, `--uncommitted`, `--untracked`; `--explain`; `--sep` — разделитель; `--json`|
|`nx show project [name]`|Итоговая конфигурация проекта (без имени — по текущей папке)|`--json` (по умолчанию вне TTY), `--json false` — человекочитаемо; `--web` — в браузере (по умолчанию в TTY); `--open=false`|
|`nx show target <proj>:<target>`|Итоговая конфигурация target'а (Nx 22.6+)|`--json`|
|`nx show target inputs <proj>:<target>`|Разрешённые входы хэша|`--check <файл, env, команда или пакет>` — входит ли это в inputs|
|`nx show target outputs <proj>:<target>`|Разрешённые выходы|`--check <путь>` — является ли путь выходом; `-c` — конфигурация|
|`nx report`|Версии Nx, плагинов, ОС — для баг-репорта|—|

### 7.4. Создание и подключение воркспейса

**`npx create-nx-workspace [name] [options]`**

|   |   |
|---|---|
|Опция|Значения / смысл|
|`--preset`|`apps`, `ts`, `npm`, `web-components`, `react-monorepo`, `react-standalone`, `angular-monorepo`, `angular-standalone`, `vue-monorepo`, `vue-standalone`, `nuxt`, `nuxt-standalone`, `next`, `nextjs-standalone`, `react-native`, `expo`, `nest`, `express`, `node-monorepo`, `node-standalone`, `ts-standalone`, а также `react` / `vue` / `angular` (выбор между monorepo и standalone) или сторонний пакет-пресет|
|`--template`|Шаблон-репозиторий: `nrwl/empty-template`, `nrwl/react-template`, `nrwl/angular-template`, `nrwl/typescript-template`|
|`--workspaceType`|`integrated`, `package-based`, `standalone`|
|`--name`, `--appName`|Имя воркспейса и первого приложения|
|`--pm`, `--packageManager`|`npm` (по умолчанию), `pnpm`, `yarn`, `bun`|
|`--workspaces`|Использовать workspaces пакетного менеджера (по умолчанию `true`)|
|`--useProjectJson`|`project.json` вместо поля `nx` в `package.json`|
|`--bundler`, `--framework`, `--style`|Сборщик, фреймворк, стили для выбранного стека|
|`--unitTestRunner`|`jest`, `vitest`, `none`|
|`--e2eTestRunner`|`playwright`, `cypress`, `none`|
|`--linter`|`eslint`, `oxlint`, `none`|
|`--formatter`|`prettier`, `oxfmt`, `none`|
|`--nxCloud`, `--ci`|`github`, `gitlab`, `azure`, `bitbucket-pipelines`, `circleci`, `yes`, `skip`|
|`--defaultBase`|Базовая ветка (по умолчанию `main`)|
|`--routing`, `--ssr`, `--standaloneApi`, `--zoneless`, `--prefix`|Опции Angular/React-приложения|
|`--nextAppDir`, `--nextSrcDir`, `--useReactRouter`, `--docker`|Опции Next.js, React Router SSR, Dockerfile для Node API|
|`--aiAgents`|`claude`, `codex`, `copilot`, `cursor`, `gemini`, `opencode`, `none`|
|`--skipGit`, `--commit.name`, `--commit.email`, `--commit.message`|Управление первичным коммитом|
|`--useGitHub`, `--skipGitHubPush`|Публикация в GitHub через `gh`|
|`--interactive`, `--allPrompts` (`-a`)|Интерактивность и показ всех вопросов|
|`--trustThirdPartyPreset`, `--analytics`, `--verbose`|Прочее|

**`nx init`** — добавить Nx в существующий репозиторий: `--cacheable=build,test,lint`, `--plugins=all|skip|<список>`, `--nxCloud`, `--useDotNxInstallation` (Nx в папке `.nx`, для не-JS репозиториев), `--aiAgents`, `--interactive`.

**`nx import [sourceRepository] [destinationDirectory]`** — перенести код и git-историю из другого репозитория: `--sourceDirectory` (`--source`) — папка в исходном репо; `--destinationDirectory` (`--destination`); `--ref` — ветка; `--depth` — глубина клонирования; `--plugins=all|skip|<список>`; `--interactive`.

### 7.5. Обслуживание

|   |   |   |
|---|---|---|
|Команда|Назначение|Опции|
|`nx migrate [pkg@version или latest]`|Обновить версии и собрать `migrations.json`; с `--run-migrations` — применить|`--from` / `--to` — переопределить исходные/целевые версии пакетов; `--excludeAppliedMigrations` (с `--from`); `--include` — `required`, `optional` или `all`; `--multiMajorMode` — `direct` или `gradual`; `--runMigrations[=файл]`; `--runMigration=<pkg>:<name>` — одну миграцию; `--ifExists`; `-C`, `--createCommits` и `--commitPrefix` (по умолчанию `chore: [nx migration]` ); `--skipInstall`; `--agentic` (`claude-code`, `codex`, `opencode` или `false`) и `--validate` — миграции с участием AI-агента; `--interactive` (устарел, используйте `--include`)|
|`nx repair`|Прогнать все миграции пакета `nx` — починить конфиг после обновления в обход `nx migrate`|—|
|`nx reset`|Очистить кэш и данные воркспейса, остановить daemon|`--onlyCache`, `--onlyDaemon`, `--onlyWorkspaceData`, `--onlyCloud` (сбросить клиент Nx Cloud, удалённый кэш не трогает)|
|`nx daemon`|PID и путь к логу daemon'а|`--start`, `--stop`|
|`nx sync`|Выполнить все sync-генераторы|—|
|`nx sync:check`|Упасть, если sync-генераторы что-то изменили бы (для CI)|—|
|`nx format:write` / `nx format:check`|Отформатировать / проверить формат|`--all`, `--projects`, `--exclude`, `--libs-and-apps`, `--files`, `--base`/`--head`, `--uncommitted`/`--untracked`, `--stdin`, `--sort-root-tsconfig-paths`|
|`nx watch -- <команда>`|Выполнять команду при изменениях; в команде доступны `$NX_PROJECT_NAME`, `$NX_FILE_CHANGES`|`-p`, `--projects`; `--all`; `-d`, `--includeDependencies`; `-i`, `--initialRun`; `--verbose`|
|`nx completion [shell]`|Установить автодополнение|`--shell` — `bash`, `zsh`, `fish`, `powershell`; `--stdout`; `--force`|
|`nx configure-ai-agents`|Настроить конфиги AI-агентов для воркспейса|`--agents=…`, `--check` (`outdated` или `all`), `--interactive`|
|`nx mcp`|Запустить MCP-сервер Nx для AI-агентов|—|

### 7.6. Релизы

|   |   |   |
|---|---|---|
|Команда|Назначение|Опции|
|`nx release [specifier]`|Все три фазы подряд: version → changelog → publish|Общие: `-d`, `--dry-run`; `-g`, `--groups`; `-p`, `--projects`; `--printConfig`; `--verbose`. Также `--first-release`, `--skip-publish`, `-y`, `--yes` (без подтверждения), `--preid`|
|`nx release version [specifier]`|Вычислить и записать новые версии|`--specifier` (точная версия или `major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`, `prerelease`), `--preid`, `--first-release`, `--git-commit`, `--git-commit-message`, `--git-commit-args`, `--git-tag`, `--git-tag-message`, `--git-tag-args`, `--git-push`, `--git-push-args`, `--git-remote` (по умолчанию `origin`), `--stage-changes`, `--dockerVersion`, `--dockerVersionScheme` (экспериментально)|
|`nx release changelog [version]`|Сгенерировать changelog и GitHub/GitLab-релиз|`--from` (по умолчанию последний тег), `--to` (по умолчанию `HEAD`), `--version`, `-i`, `--interactive` (`all`, `workspace`, `projects`) — отредактировать в редакторе, `--replace-existing-contents`, `--resolve-version-plans` (`all` или `using-from-and-to`), `--first-release`, git-флаги как у `version`|
|`nx release publish`|Опубликовать (npm, crates.io, Docker)|`--registry`, `--tag` (dist-tag), `--access` (`public` или `restricted`), `--otp`, `--first-release`, плюс общие опции запуска задач (`--parallel`, `--exclude`, `--graph`, `--skipNxCache`, …)|
|`nx release plan [bump]`|Создать version plan — файл с типом изменения и текстом для changelog|`--bump` (`major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`, `prerelease`), `-m`, `--message`, `--onlyTouched` (по умолчанию `true`), `--base`, `--head`, `--files`, `--stdin`, `--uncommitted`, `--untracked`, `--exclude`|
|`nx release plan:check`|Проверить, что у всех затронутых проектов есть version plan|`--base`, `--head`, `--files`, `--stdin`, `--uncommitted`, `--untracked`, `--exclude`|

### 7.7. Nx Cloud

Команды ниже — псевдонимы `nx-cloud <команда>`; опций сверх `--help`/`--verbose` у них нет на уровне `nx`.

|   |   |
|---|---|
|Команда|Назначение|
|`nx connect`|Подключить воркспейс к Nx Cloud (`--generateToken` — явно создать токен)|
|`nx login [url]` / `nx logout`|Авторизация разработчика в Nx Cloud|
|`nx start-ci-run`|Начать CI-запуск с распределением задач (обычно с `--distribute-on="…"`)|
|`nx start-nx-agents`|Поднять Nx Agents по конфигурации `.nx/ci-config.yaml`|
|`nx start-agent`|Запустить собственный агент распределённого выполнения|
|`nx stop-all-agents`|Остановить все агенты текущего CI-запуска|
|`nx record -- <команда>`|Записать произвольную команду (логи и время) в отчёт CI-запуска|
|`nx fix-ci`|Self-healing CI: найти и предложить исправление упавших задач|
|`nx apply-locally`|Применить предложенное self-healing исправление локально|
|`nx view-logs`|Загрузить метрики последнего запуска в Nx Cloud и открыть аналитику|
|`nx download-cloud-client`|Скачать клиент Nx Cloud|

## 8. Nx Release: версии, changelog, публикация

`nx release` закрывает то, что раньше делали Lerna, Changesets или semantic-release: вычисляет версии, обновляет зависимые пакеты, пишет changelog, создаёт git-коммит, теги и GitHub/GitLab-релизы и публикует пакеты в npm, crates.io или Docker-реестр. Работает без конфигурации; первый запуск всегда делайте с `--dry-run`.

### 8.1. Три фазы

1. **Version** — определить новую версию (из аргумента, conventional commits или version plans) и записать её в манифесты (`package.json`, `Cargo.toml`), обновив диапазоны у зависимых проектов.
2. **Changelog** — собрать записи из коммитов или version plans в `CHANGELOG.md` воркспейса и/или проектов, создать релиз на GitHub/GitLab.
3. **Publish** — запустить target `nx-release-publish` у каждого проекта (для JS это `npm publish` из папки пакета или из `dist`).

```bash
nx release --first-release --dry-run   # первый раз: посмотреть, что произойдёт
nx release                             # спросит major/minor/patch или версию
nx release minor --skip-publish        # только версия + changelog
nx release version 2.0.0 --dry-run     # фазы можно запускать по отдельности
nx release changelog 2.0.0
nx release publish --tag next --registry https://npm.example.com
```

### 8.2. Fixed и independent

- **Fixed** (по умолчанию) — все выбранные проекты получают одну версию и один тег `v{version}`.
- **Independent** (`"projectsRelationship": "independent"`) — у каждого проекта своя версия и тег `{projectName}@{version}`.
- **Release groups** (`release.groups`) — несколько групп в одном репозитории со своими правилами: например, fixed-группа UI-библиотек и independent-группа утилит.

### 8.3. Откуда берётся версия

- **Явно**: `nx release 1.4.0` или `nx release patch`.
- **Conventional commits** (`release.version.conventionalCommits: true`): `fix:` → patch, `feat:` → minor, `!`/`BREAKING CHANGE` → major. Для версий `0.x` в Nx 23 по умолчанию сдвиг на ступень ниже (`adjustSemverBumpsForZeroMajorVersion`).
- **Version plans** (`release.versionPlans: true`): разработчик в PR запускает `nx release plan minor -m "Новый компонент Tabs"`, в репозиторий попадает файл в `.nx/version-plans/`; при релизе файлы применяются и удаляются. В CI `nx release plan:check` проверяет, что у затронутых проектов есть план.

### 8.4. Ключевые настройки `release` в nx.json

|   |   |
|---|---|
|Поле|Смысл|
|`projects`|Какие проекты участвуют (шаблоны как у `-p`)|
|`projectsRelationship`|`fixed` или `independent`|
|`groups`|Группы релиза со своей конфигурацией|
|`releaseTag.pattern`|Шаблон тега: `{version}`, `{projectName}`, `{releaseGroupName}`|
|`releaseTag.requireSemver`, `strictPreid`, `checkAllBranchesWhen`|Проверка тегов и выбор веток при поиске текущей версии|
|`version.conventionalCommits`|Вычислять бамп из коммитов|
|`version.preserveMatchingDependencyRanges`|Не трогать диапазоны зависимых, если новая версия в них укладывается (по умолчанию `true`)|
|`version.updateDependents`|`always` (по умолчанию), `auto`, `never`|
|`version.manifestRootsToUpdate`|Где обновлять манифест, например `dist/packages/{projectName}`|
|`version.applyPreidToDependents`|Распространять `--preid` на бампы зависимых|
|`changelog.workspaceChangelog` / `projectChangelogs`|Включение, файл, `createRelease: "github"` или `"gitlab"`, `replaceExistingContents`|
|`git.commit`, `git.tag`, `git.push`|Автоматические git-операции|
|`versionPlans`|Включить file-based versioning|
|`docker`|Версионирование и публикация Docker-образов (экспериментально): `versionSchemes`, `registryUrl`, `repositoryName`|

Для сложных сценариев есть программный API (`ReleaseClient` из `nx/release`): можно написать свой скрипт, вызывая фазы по очереди и вставляя между ними сборку или проверки.

### 8.5. Типичная схема в CI

1. В PR: `nx release plan` (или conventional commits) + проверка `nx release plan:check`.
2. При мерже в `main` или по ручному запуску: `nx release --skip-publish` (коммит с версиями и тегами, пуш).
3. Job на тег: `nx run-many -t build` и `nx release publish` с токеном реестра (npm provenance включается через `NPM_CONFIG_PROVENANCE=true`).

## 9. CI и Nx Cloud

Скорость CI в Nx складывается из четырёх механизмов: **affected** (не делать лишнего), **удалённый кэш** (не делать повторно), **распределение** (делать параллельно на нескольких машинах) и **self-healing** (быстрее чинить упавшее). Первый работает без облака, остальные три требуют Nx Cloud (есть бесплатный тариф). Все они срабатывают, только если задачи запускаются через `nx`: прямой вызов `jest` или `tsc` в CI их обходит.

### 9.1. Минимальный пайплайн без облака

```yaml
# .github/workflows/ci.yml
name: CI
on: { push: { branches: [main] }, pull_request: {} }
permissions: { actions: read, contents: read }
jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with: { fetch-depth: 0, filter: tree:0 }   # нужна история для affected
      - uses: actions/setup-node@v6
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - uses: nrwl/nx-set-shas@v5                 # NX_BASE = последний зелёный коммит main
      - run: npx nx sync:check
      - run: npx nx format:check
      - run: npx nx affected -t lint test build typecheck
```

Сгенерировать готовый workflow: `nx g @nx/workspace:ci-workflow --ci=github` (также `gitlab`, `azure`, `circleci`, `bitbucket-pipelines`). В GitLab аналог `nx-set-shas` — `NX_HEAD=$CI_COMMIT_SHA`, `NX_BASE=${CI_MERGE_REQUEST_DIFF_BASE_SHA:-$CI_COMMIT_BEFORE_SHA}`.

### 9.2. Удалённый кэш

`nx connect` регистрирует воркспейс и записывает `nxCloudId` в `nx.json`. После этого каждый запуск задачи сначала ищет результат в Nx Cloud, а промахи туда же сохраняет. Разработчики получают результаты CI на своих машинах и наоборот. Права разграничиваются токенами: в CI для `main` — read-write, для PR из форков — read-only (`NX_CLOUD_ACCESS_TOKEN`). Кэш можно шифровать end-to-end ключом `nxCloudEncryptionKey` / `NX_CLOUD_ENCRYPTION_KEY`.

### 9.3. Распределение задач (Nx Agents)

Вместо ручного шардинга Nx Cloud раздаёт задачи графа нескольким агентам, учитывая порядок, длительность и потребление CPU/памяти из прошлых запусков. Логи и артефакты проигрываются в основной job, так что следующие шаги работают как обычно.

```yaml
# .nx/ci-config.yaml
dte:
  distribute-on:
    small-changeset: 3 linux-medium-js    # агентов по доле затронутых проектов
    large-changeset: 8 linux-large-js
lifecycle:
  stop-after: [build]                     # гасить простаивающих агентов
```

```yaml
# шаги в .github/workflows/ci.yml
- run: npx nx-cloud start-nx-agents       # до установки зависимостей, чтобы агенты грелись параллельно
- run: npm ci
- run: npx nx affected -t lint test build e2e-ci
- run: npx nx fix-ci
  if: always()
```

`linux-medium-js`, `linux-large-js` — готовые launch templates; свои описываются в `.nx/workflows/*.yaml`. Конфликты за общий ресурс (порт, БД) задаются через `dte.scheduling-constraints`, отправка задач на особые машины — через assignment rules. Старый способ запуска — `nx start-ci-run --distribute-on="3 linux-medium-js"`; можно подключить и собственные машины (`nx start-agent`). Задачи, которые распределяются, обязаны быть кэшируемыми.

**Атомизация задач**: плагины Playwright, Cypress, Vitest и Jest умеют выводить target `e2e-ci` (или `test-ci`), разбитый на задачи по файлам (`e2e-ci--src/login.spec.ts`), чтобы один длинный набор тестов разошёлся по агентам. Флаки-тесты автоматически перезапускаются на другом агенте.

### 9.4. Self-healing CI

Последний шаг `npx nx fix-ci` с `if: always()`: при падении задачи Nx Cloud анализирует ошибку, предлагает исправление в PR или интерфейсе Nx Cloud, а `nx apply-locally` применяет его у разработчика.

### 9.5. Чек-лист CI

- `fetch-depth: 0` и корректный `NX_BASE` (последний успешный коммит `main`), иначе affected будет либо «всё», либо ошибётся.
- Один вызов `nx affected -t …` на все target'ы, а не отдельные шаги по типам задач — Nx сам выстроит порядок.
- `nx sync:check` и `nx format:check` как быстрые проверки.
- В CI daemon выключен автоматически; вывод по умолчанию `static-failures-only`.
- Не отключайте кэш для target'ов, которые хотите распределять.

## 10. Диагностика и шпаргалка

Большинство проблем с Nx — это либо неверные `inputs`/`outputs`, либо устаревшее состояние (daemon, кэш графа), либо неожиданный результат слияния конфигурации. Начинайте с `nx show project`/`nx show target` и `nx reset`.

### 10.1. Симптом → причина → что делать

|   |   |   |
|---|---|---|
|Симптом|Вероятная причина|Что делать|
|Задача не берётся из кэша, хотя «ничего не менялось»|В inputs попадает меняющийся файл, env или все внешние зависимости|`nx show target inputs <p>:<t>`; сузить `production`, добавить `externalDependencies`; сравнить запуски с `--verbose`|
|Задача взята из кэша, хотя результат должен был измениться|Неполные inputs (не учтён конфиг, env, сгенерированный файл)|Добавить файл/`{"env": …}`/`includeIgnored`; проверить `nx show target inputs … --check <файл>`|
|После попадания в кэш нет артефактов|Файлы пишутся вне `outputs`|`nx show target outputs <p>:<t>`; поправить `outputs`|
|`nx affected` запускает всё|Изменился lock-файл, `nx.json` или глобальный input; неверный `base`|`pluginsConfig.@nx/js.projectsAffectedByDependencyUpdates: "auto"`; проверить `NX_BASE`; `--explain` в task-режиме|
|Нет нужного target'а у проекта|Плагин не зарегистрирован, `include`/`exclude` отсекает файл, имя перехвачено другим плагином|`nx show project <p> --web` (видно источник каждого target'а); порядок `plugins`|
|«The workspace is out of sync»|Sync-генератор хочет обновить tsconfig references и т.п.|`nx sync`; в CI — `nx sync:check`|
|Странные ошибки после переключения веток или обновления|Устаревший daemon / кэш графа|`nx reset` (или `--onlyDaemon`, `--onlyWorkspaceData`)|
|Команда «зависает» на зависимости|В `dependsOn` долгоживущая задача без `continuous: true`|Пометить `serve`/`dev` как `continuous`|
|Две e2e-задачи конфликтуют за порт|Параллельный запуск|`"parallelism": false` у target'а|
|Цикл в графе задач|`dependsOn` замыкается|`nx graph --view=tasks`; разорвать цикл (крайний случай — `--nxIgnoreCycles`)|
|Daemon не стартует в песочнице/контейнере|Нет доступа к сокету|`NX_DAEMON=false` или `NX_SOCKET_DIR`|
|Нужен подробный лог|—|`NX_VERBOSE_LOGGING=true`, `--verbose`, лог daemon'а по пути из `nx daemon`|

### 10.2. Шпаргалка

```bash
# старт
npx create-nx-workspace@latest myorg      # новый воркспейс
npx nx@latest init                        # добавить в существующий
nx add @nx/vite                           # плагин

# запуск
nx build web                              # одна задача
nx run web:build:production               # с конфигурацией
nx run-many -t lint test build            # всё
nx run-many -t test -p 'tag:scope:ui'     # по тэгу
nx affected -t lint test build            # только затронутое
nx affected -t test --base=origin/main    # для PR

# понимание
nx graph                                  # граф проектов
nx run-many -t build --graph              # граф задач
nx show projects --affected               # затронутые проекты
nx show project web --web                 # итоговая конфигурация
nx show target inputs web:build           # входы хэша

# генерация
nx g @nx/js:lib packages/utils --dry-run
nx list @nx/react

# обслуживание
nx migrate latest && npm i && nx migrate --run-migrations
nx sync                                   # синхронизировать tsconfig и пр.
nx reset                                  # сбросить кэш и daemon
nx report                                 # версии для баг-репорта

# релизы
nx release --dry-run
nx release plan minor -m "…"

# CI / облако
nx connect
nx fix-ci
```

## Источники

- [Nx CLI Command Reference](https://nx.dev/docs/reference/nx-commands)
- [create-nx-workspace](https://nx.dev/docs/reference/create-nx-workspace)
- [nx.json Reference](https://nx.dev/docs/reference/nx-json)
- [Project Configuration](https://nx.dev/docs/reference/project-configuration)
- [Inputs and Named Inputs](https://nx.dev/docs/reference/inputs)
- [Mental Model](https://nx.dev/docs/concepts/mental-model)
- [How caching works](https://nx.dev/docs/concepts/how-caching-works)
- [Nx Daemon](https://nx.dev/docs/reference/nx-daemon)
- [Run Only Tasks Affected by a PR](https://nx.dev/docs/features/ci-features/affected)
- [Enforce Module Boundaries](https://nx.dev/docs/features/enforce-module-boundaries)
- [Manage Releases](https://nx.dev/docs/features/manage-releases)
- [Distribute Task Execution (Nx Agents)](https://nx.dev/docs/features/ci-features/distribute-task-execution)
- [Setting Up CI](https://nx.dev/docs/getting-started/setup-ci)
- [Add to an Existing Project](https://nx.dev/docs/getting-started/start-with-existing-project)
- [TypeScript в Nx](https://nx.dev/docs/technologies/typescript/introduction)
- [Nx Changelog](https://nx.dev/changelog)
- [nx на npm](https://www.npmjs.com/package/nx?activeTab=versions)