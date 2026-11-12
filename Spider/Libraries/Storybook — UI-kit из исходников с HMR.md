# Постановка

Два репозитория:

- **ui-kit** — библиотека Angular (ng-packagr), публикуется в реестр;
- **storybook** — отдельный проект со сторями, потребляет `@acme/ui-kit` как обычную зависимость из `node_modules`.

Обычный цикл проверки правки в ui-kit: собрать библиотеку → `npm pack`/подложить в `node_modules` → перезапустить Storybook. Хочется: **опционально** запускать Storybook так, чтобы `@acme/ui-kit` резолвился **в исходники** соседнего чекаута, а правки подхватывались без пересборки пакета. При этом обычные сборки (CI, к которому нет доступа) не должны меняться вообще.

Стек: Angular 21, Storybook 10 (`@storybook/angular-vite`), Vite 8, запуск через `angular.json`.

> [!success] Вердикт: возможно
> Задача решается **только конфигами**, без патчей пакетов и без монорепы. Ниже — проверка по исходникам, механизм и полный набор файлов.

> [!important] Но сначала прочитайте [[#3.0 Сначала: а нужен ли вообще режим исходников]]
> Есть более дешёвый вариант — `ng build ui-kit --watch` плюс `npm link` на `dist`. Он не требует почти никакой конфигурации и проверяет ровно тот артефакт, который уедет в реестр. Режим исходников оправдан, только если watch-пересборка вышла за ~10 секунд или критична потеря состояния компонента при перезагрузке.

---
# Часть 1. Проверка выполнимости

## 1.1 Что вообще происходит при запуске

```
ng run <project>:storybook
  └─ @storybook/angular-vite:start-storybook   (Angular-билдер, читает angular.json)
       └─ storybook dev  →  builder-vite  →  Vite 8 dev-server
            └─ пресет фреймворка (viteFinal) добавляет в конфиг Vite:
                 • @analogjs/vite-plugin-angular   ← вся компиляция Angular живёт здесь
                 • optimizeDeps.include [@angular/*, tslib, …]
                 • плагины storybook (csf, mock-loader, options)
            └─ viteFinal из .storybook/main.ts  ← наша точка вмешательства
```

Ключевое: **`@storybook/angular-vite` сам ничего не компилирует**. Компиляция Angular (декораторы, `templateUrl`, `styleUrls`, Ivy-инструкции) целиком делегирована `@analogjs/vite-plugin-angular`. Значит вопрос «получится ли собирать библиотеку из исходников» — это вопрос «пропустит ли аналоговский плагин через себя файлы, лежащие вне этого репозитория».

## 1.2 Четыре жёстких ограничения (проверено по коду)

**① Плагин не трогает ничего внутри `node_modules`.**
Фильтр `transform`-хука (`@analogjs/vite-plugin-angular@2.6.4`, `angular-vite-plugin.ts:606–620`):

```ts
transform: {
  filter: {
    id: {
      include: [TS_EXT_REGEX],
      exclude: [/node_modules/, 'type=script', '@ng/component', /[?&]raw\b/],
    },
  },
```

Файл, чей **резолвнутый абсолютный путь** содержит `node_modules`, не компилируется вообще. Декораторы останутся сырыми → `NG0204`/падение на старте.

*Следствие:* подкладывать исходники в `node_modules/@acme/ui-kit` — тупик. `npm link` работает **только** потому, что Vite по умолчанию разыменовывает симлинки (`resolve.preserveSymlinks: false`) и id становится реальным путём. Но у pnpm реальный путь лежит в `node_modules/.pnpm/…` — снова `node_modules`, снова тупик. Поэтому надёжный способ ровно один: **alias на реальный путь исходников вне `node_modules`**.

**② Файл обязан входить в TypeScript-программу.**
`angular-vite-plugin.ts:720–736`:

```ts
const typescriptResult = fileEmitter(id);
if (!typescriptResult) {
  const isAngular = !id.includes('@ng/component') && ANGULAR_DECORATOR_CALL_RE.test(code);
  if (isAngular) {
    this.warn(
      `[@analogjs/vite-plugin-angular]: "${id}" contains Angular decorators but is not in the TypeScript program. ` +
      `Ensure it is included in your tsconfig.`,
    );
  }
  return;
}
```

`fileEmitter` — это эмиттер `ts.Program`, построенной из **одного** tsconfig. Программа собирается из `rootNames` = файлы из `include`/`files` этого tsconfig (плюс опция плагина `include`, `angular-vite-plugin.ts:1216`). Файл вне программы молча пропускается — с предупреждением в консоли, если в нём есть декораторы.

*Следствие:* исходники ui-kit нужно добавить в `include` того tsconfig, который получит плагин.

**③ Плагин получает tsconfig из опции билдера `tsConfig`.**
Пресет фреймворка (`storybook/code/frameworks/angular-vite/src/preset.ts:143–155`):

```ts
const angularPlugins = angular({
  jit: framework.options?.jit ?? true,
  liveReload: framework.options?.liveReload ?? false,
  tsconfig: framework.options?.tsconfig ?? (options?.tsConfig ?? './.storybook/tsconfig.json'),
  inlineStylesExtension: framework.options?.inlineStylesExtension ?? 'css',
});
```

`options.tsConfig` — это опция Angular-билдера, объявленная в схеме `start-storybook` («The full path for the TypeScript configuration file, relative to the current workspace»). Значит **tsconfig переключается на уровне таргета/конфигурации в `angular.json`** — ровно тот опциональный переключатель, который нужен.

**④ Vite умеет отдавать и следить за файлами вне `root`, но с двумя условиями.**
`vite@8/utils.ts:741`:

```ts
export function ensureWatchedFile(watcher, file, root) {
  if (file && !file.startsWith(withTrailingSlash(root)) && !file.includes('\0') && fs.existsSync(file)) {
    watcher.add(path.resolve(file));   // файл вне root добавляется в вотчер явно
  }
}
```

Вызывается из `transformRequest.ts` только если `isFileLoadingAllowed(...)` → то есть путь разрешён в `server.fs.allow`. И дефолтный `ignored` вотчера (`vite@8/watch.ts:56–63`) содержит `**/node_modules/**` — ещё одно подтверждение ①: даже если файл в `node_modules` скомпилируется, изменения в нём не будут отслеживаться.

## 1.3 Бонус: настоящий HMR, а не только reload

В плагине есть опция `liveReload`, и она включает **официальный Angular-HMR**, а не просто перезагрузку страницы:

- `tsCompilerOptions['_enableHmr'] = true` (`:975`, `:1165`);
- `angularCompiler.emitHmrUpdateModule(...)` → `hmrUpdateCode`/`hmrEligible` (`:1808–1821`);
- `sendHMRComponentUpdate(server, id)` (`:1683`) — точечная подмена метаданных компонента (`ɵɵreplaceMetadata`), состояние приложения сохраняется;
- инстанс компиляции переиспользуется между пересборками, чтобы Angular мог диффить состояние (`:235–241`);
- гейт: `if (angularFullVersion < 190000 || isTest) pluginOptions.liveReload = false` — Angular 21 проходит.

Storybook по умолчанию ставит `liveReload: false`, но пробрасывает опцию через `framework.options.liveReload`. То есть HMR доступен и включается одной строкой.

Ещё одна приятная деталь: `disableTypeChecking` в плагине по умолчанию `true` (`:171`). Ошибки типов в исходниках библиотеки **не уронят дев-сервер** — важно, потому что мы будем компилировать библиотеку чужими (сторибуковскими) `compilerOptions`.

## 1.4 Итог проверки

| Требование | Достижимо | Механизм |
|---|---|---|
| Резолв `@acme/ui-kit` в исходники | да | `resolve.alias` на абсолютный путь вне `node_modules` |
| Компиляция Angular-исходников вне репо | да | файлы в `include` отдельного tsconfig + `tsConfig` на таргете |
| Отдача файлов вне `root` | да | `server.fs.allow` |
| Слежение за изменениями | да | Vite сам добавляет out-of-root файлы в вотчер |
| HMR без перезагрузки | да | `framework.options.liveReload: true` |
| Не ломать обычную сборку/CI | да | отдельная `configuration` + env-флаг; дефолтный путь не меняется |

> [!warning] Что честно считать рисками
> - `@storybook/angular-vite` официально в статусе **preview** — дефолты и опции могут поменяться в минорах.
> - Библиотека компилируется `compilerOptions` **сторибука**, а не своими → поведение может отличаться от `ng-packagr`-сборки. Это режим отладки, а не замена проверке на собранном пакете.
> - Дублирование Angular при наличии своего `node_modules` у ui-kit — решается `resolve.dedupe`, но именно здесь ломается чаще всего (см. 3.3).

---
# Часть 2. Решение

Плейсхолдеры для замены:

| Плейсхолдер | Что это |
|---|---|
| `@acme/ui-kit` | имя npm-пакета библиотеки |
| `ui-storybook` | имя проекта в `angular.json` сторибука |
| `../ui-kit` | путь до чекаута ui-kit относительно корня репо сторибука |
| `projects/ui-kit/src` | путь до исходников внутри репо ui-kit |
| `public-api.ts` | точка входа библиотеки |

Схема из четырёх файлов:

```
storybook-repo/
├─ .storybook/
│  ├─ main.ts                     ← + блок под флагом (no-op без флага)
│  ├─ tsconfig.json               ← не трогаем (путь CI)
│  └─ tsconfig.uikit-src.json     ← НОВЫЙ: программа с исходниками ui-kit
├─ tools/
│  └─ storybook-uikit-src.mjs     ← НОВЫЙ: кросс-платформенный запуск
├─ angular.json                   ← + configuration "uikit-src" (опционально)
└─ package.json                   ← + скрипт
```

## 2.1 `.storybook/tsconfig.uikit-src.json`

```jsonc
{
  // Наследуемся от боевого сторибуковского tsconfig: все compilerOptions
  // (target, lib, experimentalDecorators, strict-флаги, types) берутся оттуда.
  "extends": "./tsconfig.json",

  "compilerOptions": {
    // ── baseUrl ────────────────────────────────────────────────────────────
    // ВАЖНО: при `extends` относительные пути резолвятся относительно того
    // файла, где они НАПИСАНЫ. Но `paths` резолвятся относительно `baseUrl`,
    // а `baseUrl` мы могли унаследовать от родителя — и тогда наши `paths`
    // поедут. Поэтому baseUrl объявляем здесь заново и явно.
    "baseUrl": ".",

    // ── rootDir ────────────────────────────────────────────────────────────
    // Нужно ТОЛЬКО если в базовом tsconfig задан `rootDir`. TS ругается
    // "File ... is not under 'rootDir'" на всё, что вне него. Поднимаем до
    // общего предка обоих репозиториев. Если rootDir в базовом не задан —
    // эту строку удалить, она ничего не улучшает.
    "rootDir": "../..",

    // ── paths ──────────────────────────────────────────────────────────────
    // Это НЕ влияет на рантайм-резолв Vite (он tsconfig.paths не читает,
    // см. 3.2) — только на резолв типов и на построение программы TS.
    // Держать в синхроне с alias в main.ts.
    "paths": {
      "@acme/ui-kit": ["../../ui-kit/projects/ui-kit/src/public-api.ts"],
      // Вторичные entry points ng-packagr (@acme/ui-kit/button и т.п.):
      // раскомментировать и выправить под реальную раскладку, см. 3.5
      // "@acme/ui-kit/*": ["../../ui-kit/projects/ui-kit/*/src/public-api.ts"]
    }
  },

  // ── include ───────────────────────────────────────────────────────────────
  // ГЛАВНЫЙ ПУНКТ: `include` при `extends` НЕ мержится, а ПЕРЕЗАПИСЫВАЕТСЯ.
  // Поэтому здесь нужно повторить всё, что было в базовом tsconfig, плюс
  // исходники ui-kit. Сверьтесь со своим .storybook/tsconfig.json.
  "include": [
    "../src/**/*.stories.ts",     // сторя (пример — подставьте свои глобы)
    "../src/**/*.d.ts",
    "./*.ts",                     // main.ts / preview.ts

    // Ради чего всё затевалось: файлы попадают в rootNames ts.Program,
    // и fileEmitter начинает их эмитить (ограничение ② из части 1).
    "../../ui-kit/projects/ui-kit/**/*.ts"
  ],

  // Тесты и сторя библиотеки в программу тянуть не нужно: они замедляют
  // компиляцию и притаскивают devDependencies, которых нет в этом репо.
  "exclude": [
    "../../ui-kit/**/*.spec.ts",
    "../../ui-kit/**/*.stories.ts",
    "../../ui-kit/**/node_modules/**"
  ]
}
```

> [!note] Почему путь до ui-kit здесь захардкожен
> `tsconfig.json` — статический JSON, переменные окружения он не читает. Варианты: (а) договориться о раскладке «репозитории — соседние папки» (проще всего, рекомендую); (б) генерировать этот файл скриптом из шаблона и держать в `.gitignore` (см. 4.6).

## 2.2 `.storybook/main.ts`

Существующий файл не переписываем — добавляем блок, который **при отсутствии флага возвращает конфиг без изменений**.

```ts
import type { StorybookConfig } from '@storybook/angular-vite';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Флаг режима «UI-kit из исходников».
 * Значение — путь до чекаута ui-kit (абсолютный или относительный к cwd).
 * Ставится скриптом tools/storybook-uikit-src.mjs. Пусто → обычный режим,
 * весь код ниже становится no-op, конфиг байт-в-байт как был.
 */
const UIKIT_SRC = process.env['UIKIT_SRC'];

const UIKIT_PKG = '@acme/ui-kit';
const UIKIT_SRC_DIR = 'projects/ui-kit/src';
const UIKIT_ENTRY = 'public-api.ts';

/**
 * Пакеты, которые обязаны существовать в единственном экземпляре.
 * Подробности в 3.3. Список расширяйте всем, что держит глобальное состояние
 * или используется в instanceof/InjectionToken-сравнениях.
 */
const SINGLETONS = [
  '@angular/core',
  '@angular/common',
  '@angular/common/http',
  '@angular/forms',
  '@angular/router',
  '@angular/animations',
  '@angular/platform-browser',
  '@angular/cdk',        // если используется
  'rxjs',
  'rxjs/operators',
  'tslib',
  'zone.js',             // только если zoneless: false
];

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|mdx)'],
  addons: ['@storybook/addon-docs'],

  framework: {
    name: '@storybook/angular-vite',
    options: {
      /**
       * Включаем настоящий Angular-HMR (ɵɵreplaceMetadata) вместо full-reload.
       * Storybook по умолчанию ставит false. Включаем ТОЛЬКО в режиме
       * исходников, чтобы обычный запуск остался с дефолтным поведением.
       * Требует Angular >= 19; в тестовом режиме плагин сам его выключает.
       * Если словите артефакты (не применяется правка, «залипший» компонент) —
       * поставьте false: получите быстрый reload iframe вместо HMR.
       */
      liveReload: !!UIKIT_SRC,

      // jit: true — дефолт фреймворка, не трогаем.
      // tsconfig здесь НЕ указываем: он приходит из опции билдера tsConfig,
      // иначе значение из main.ts перебьёт переключение по конфигурациям.
    },
  },

  async viteFinal(viteConfig) {
    const { mergeConfig, searchForWorkspaceRoot } = await import('vite');

    // ── здесь остаётся ваша текущая настройка (dedupe/aliases/tsconfig-paths) ──
    // let cfg = mergeConfig(viteConfig, { ...то, что уже было... });
    let cfg = viteConfig;

    // Обычный режим — выходим, ничего не изменив.
    if (!UIKIT_SRC) {
      return cfg;
    }

    const uikitRoot = resolve(process.cwd(), UIKIT_SRC);
    const uikitSrc = join(uikitRoot, UIKIT_SRC_DIR);
    const uikitEntry = join(uikitSrc, UIKIT_ENTRY);

    // Падаем громко и рано: иначе получим невнятную ошибку резолва
    // где-то в глубине Vite через минуту после старта.
    if (!existsSync(uikitEntry)) {
      throw new Error(
        `[storybook] UIKIT_SRC="${UIKIT_SRC}" → не найден ${uikitEntry}.\n` +
        `Проверьте путь до чекаута ui-kit и значение UIKIT_SRC_DIR/UIKIT_ENTRY.`,
      );
    }

    return mergeConfig(cfg, {
      resolve: {
        /**
         * Ради чего всё: bare-спецификатор @acme/ui-kit перестаёт вести
         * в node_modules и ведёт в исходники.
         *
         * Форма массива с RegExp — принципиально:
         *   • строковый alias в Vite работает как PREFIX-совпадение, поэтому
         *     find: '@acme/ui-kit' перехватил бы и '@acme/ui-kit/button',
         *     склеив путь в мусор;
         *   • якоря ^…$ делают правила взаимоисключающими, порядок не важен.
         *
         * mergeConfig обрабатывает resolve.alias особым образом (mergeAlias):
         * массивы нормализуются и НАШИ правила встают ПЕРВЫМИ, то есть
         * приоритетнее существующих. Если в проекте alias заданы объектом,
         * а здесь массивом — Vite всё равно приведёт к массиву корректно.
         */
        alias: [
          // Вторичные entry points — ПЕРЕД основным (при regex не критично,
          // но так читается очевиднее). Раскомментировать при наличии, см. 3.5.
          // {
          //   find: new RegExp(`^${UIKIT_PKG}/(.+)$`),
          //   replacement: join(uikitRoot, 'projects/ui-kit/$1/src/public-api.ts'),
          // },
          {
            find: new RegExp(`^${UIKIT_PKG}$`),
            replacement: uikitEntry,
          },
        ],

        /**
         * Критично. Bare-импорты ВНУТРИ файлов ui-kit ('@angular/core' и т.п.)
         * резолвятся Node-алгоритмом от папки самого файла вверх — то есть
         * сначала в <ui-kit>/node_modules. Получаем два Angular в графе:
         * разные InjectionToken, разные класс-идентичности, NG0203 и
         * «инжектор не находит провайдер, который точно есть».
         * dedupe заставляет Vite резолвить эти пакеты всегда от корня
         * текущего проекта. Подробнее в 3.3.
         */
        dedupe: SINGLETONS,

        /**
         * Явно фиксируем дефолт: симлинки разыменовываются в реальный путь.
         * Если где-то в проекте стоит true — режим исходников сломается
         * (см. ограничение ① — id останется внутри node_modules).
         */
        preserveSymlinks: false,
      },

      server: {
        fs: {
          /**
           * Vite по умолчанию запрещает отдавать файлы вне workspace root
           * (403 в Network). Наш ui-kit — отдельный git-репозиторий, то есть
           * заведомо снаружи.
           *
           * ВАЖНО: как только fs.allow задан явно, автоопределение workspace
           * root ОТКЛЮЧАЕТСЯ. Поэтому searchForWorkspaceRoot() возвращаем
           * в список руками, иначе отвалится текущий проект.
           */
          allow: [searchForWorkspaceRoot(process.cwd()), uikitRoot],
        },
      },

      optimizeDeps: {
        /**
         * Страховка: пакет не должен попасть в предбандл esbuild/rolldown.
         * Предбандленная зависимость — это застывший артефакт в .vite/deps,
         * у него нет ни HMR, ни слежения за исходниками.
         * По идее alias уводит спецификатор в исходники ещё до оптимизатора,
         * но exclude защищает от случаев, когда пакет импортируется
         * транзитивно из другой зависимости.
         */
        exclude: [UIKIT_PKG],

        /**
         * Если ui-kit тянет CJS-зависимость из СВОЕГО node_modules и она
         * падает с «does not provide an export named …» — предбандлить её
         * адресно вот так (синтаксис вложенной зависимости Vite):
         * include: [`${UIKIT_PKG} > some-cjs-dep`],
         */
      },

      css: {
        preprocessorOptions: {
          scss: {
            /**
             * Пути поиска для @use/@import внутри SCSS библиотеки.
             * Нужно, если компоненты пишут @use 'variables' в расчёте на
             * includePaths из сборки ng-packagr.
             * Альтернатива — stylePreprocessorOptions на таргете (см. 2.4),
             * там пути резолвятся относительно workspaceRoot.
             */
            loadPaths: [join(uikitSrc, 'styles'), uikitSrc],
          },
        },
      },
    });
  },
};

export default config;
```

## 2.3 `tools/storybook-uikit-src.mjs`

Зачем отдельный файл: `VAR=value ng run …` в npm-скриптах не работает в Windows-cmd, а тащить `cross-env` в корпоративный проект ради одной команды — лишнее. Плюс здесь удобно проверить путь до чекаута и дать понятную ошибку.

```js
#!/usr/bin/env node
/**
 * Запуск Storybook в режиме «UI-kit из исходников».
 *
 *   node tools/storybook-uikit-src.mjs                 # ../ui-kit по умолчанию
 *   node tools/storybook-uikit-src.mjs ../../lib/ui-kit
 *   UIKIT_SRC=/abs/path node tools/storybook-uikit-src.mjs
 *
 * Делает ровно две вещи:
 *   1. кладёт абсолютный путь до ui-kit в UIKIT_SRC — его читает
 *      .storybook/main.ts и включает alias/fs.allow/dedupe;
 *   2. запускает Angular-билдер с ДРУГИМ tsconfig — тем, в include
 *      которого попали исходники библиотеки.
 *
 * angular.json при этом можно не трогать вообще: tsConfig передаётся
 * флагом --ts-config (Architect переводит camelCase-опции схемы в dash-case).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_UIKIT_PATH = '../ui-kit';
const PROJECT = 'ui-storybook';                          // имя проекта в angular.json
const TSCONFIG = '.storybook/tsconfig.uikit-src.json';

const uikitRoot = resolve(
  process.cwd(),
  process.argv[2] ?? process.env.UIKIT_SRC ?? DEFAULT_UIKIT_PATH,
);

if (!existsSync(uikitRoot)) {
  console.error(
    `\n[storybook:uikit-src] Не найден чекаут ui-kit: ${uikitRoot}\n` +
    `Передайте путь аргументом или через UIKIT_SRC.\n`,
  );
  process.exit(1);
}

console.log(`[storybook:uikit-src] UI-kit из исходников: ${uikitRoot}`);

// Зовём ng через node + путь к бинарнику: работает одинаково в POSIX и Windows,
// не зависит от shell и от того, как разложены .bin-шимы пакетным менеджером.
const ngBin = resolve('node_modules/@angular/cli/bin/ng.js');

const child = spawn(
  process.execPath,
  [
    ngBin,
    'run',
    `${PROJECT}:storybook`,
    `--ts-config=${TSCONFIG}`,
    ...process.argv.slice(3),          // прокинуть --port, --no-open и т.п.
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, UIKIT_SRC: uikitRoot },
  },
);

child.on('exit', (code) => process.exit(code ?? 0));
```

`package.json`:

```jsonc
{
  "scripts": {
    // было — не трогаем, этим ходит CI
    "storybook": "ng run ui-storybook:storybook",
    "build-storybook": "ng run ui-storybook:build-storybook",

    // стало — дополнительная локальная команда
    "storybook:src": "node tools/storybook-uikit-src.mjs"
  }
}
```

## 2.4 `angular.json` — опционально

Если `--ts-config` по каким-то причинам не проходит (кастомная обёртка над `ng`, политика на флаги), или просто хочется, чтобы режим был виден в `angular.json` — добавьте **configuration**. Базовые `options` при этом не меняются, значит `ng run ui-storybook:storybook` для CI остаётся прежним.

```jsonc
{
  "projects": {
    "ui-storybook": {
      "architect": {
        "storybook": {
          "builder": "@storybook/angular-vite:start-storybook",
          "options": {
            "configDir": ".storybook",
            "port": 6006,
            "tsConfig": ".storybook/tsconfig.json"
          },
          "configurations": {
            // ng run ui-storybook:storybook:uikit-src
            "uikit-src": {
              "tsConfig": ".storybook/tsconfig.uikit-src.json",

              // Пути SCSS резолвятся относительно workspaceRoot
              // (preset.ts: resolve(workspaceRoot, loadPath)).
              // Дублирует loadPaths из main.ts — оставьте что-то одно.
              "stylePreprocessorOptions": {
                "includePaths": ["../ui-kit/projects/ui-kit/src/styles"]
              },

              // Compodoc по исходникам большой библиотеки заметно
              // удлиняет холодный старт — см. 4.4.
              "compodoc": false
            }
          }
        }
      }
    }
  }
}
```

Тогда в `tools/storybook-uikit-src.mjs` меняется одна строка: `${PROJECT}:storybook:uikit-src` вместо флага `--ts-config`.

---
# Часть 3. Теория: почему каждый пункт именно такой

## 3.0 Сначала: а нужен ли вообще режим исходников

> [!important] Не начинайте с этой заметки
> Есть более дешёвый способ, и в большинстве случаев его достаточно. Прочитайте этот раздел до того, как внедрять всё остальное.

**Вариант A — `ng build ui-kit --watch` + `npm link` на `dist`.** ng-packagr пересобирает библиотеку сам при сохранении, Storybook потребляет свежий `dist` как обычный пакет. Пошаговая инструкция: [[Storybook — UI-kit через npm link]].

**Вариант B — alias на исходники** (вся остальная заметка).

| | A: `--watch` + link на dist | B: alias на исходники |
|---|---|---|
| Конфига в репо сторибука | почти нет: `server.fs.allow`, при необходимости `optimizeDeps.exclude` | tsconfig + `viteFinal` + скрипт запуска |
| Задержка на правку | пересборка ng-packagr: 2–5 с на простую библиотеку, 10–30 с при множестве вторичных entry points | доли секунды |
| Состояние компонента | теряется (full reload) | сохраняется (Angular HMR) |
| Что проверяется | **ровно то, что уедет в реестр**: `exports`, вторичные точки, partial compilation, peer deps | только исходный код, вся упаковка ng-packagr в обход |
| Зависимость от preview-статуса фреймворка | нет | есть |
| Ручные действия | `npm link` в двух местах, слетает после `npm install` | одна npm-команда |

**Правило выбора.** Берите A. Переходите на B, только если выполнено хотя бы одно:

- у библиотеки много вторичных entry points и watch-пересборка вышла за ~10 секунд;
- вы правите визуальные детали состояния, до которого надо докликивать (открытый дропдаун, шаг визарда) — тогда потеря состояния при reload дороже, чем секунды;
- нужен цикл «сохранил — увидел» без единой сборки в принципе.

И главное ограничение B, которое не лечится конфигом: **режим исходников не тестирует упаковку.** Сломанный `exports`, неверно объявленный вторичный entry point, промах в `peerDependencies` — всё это в режиме исходников невидимо, потому что резолв идёт по alias мимо `package.json` библиотеки. Финальная проверка всё равно на собранном пакете.

## 3.1 Почему `npm link` не даёт исходники

Частое заблуждение: «`npm link` же и так подставит локальную библиотеку, зачем alias». Подставит — но вопрос в том, **что именно линкуется**. В репозитории Angular-библиотеки три кандидата, и они не равнозначны:

| Что линкуем | Результат |
|---|---|
| корень репо `ui-kit/` | там `package.json` рабочей области, имя обычно не `@acme/ui-kit` → резолв не сработает |
| `projects/ui-kit/` (исходники) | имя правильное, но в этом `package.json` **нет** `main`/`module`/`exports`/`types` — их генерирует ng-packagr в `dist`. Резолв упадёт. Чинится только правкой `package.json` **в репозитории библиотеки**, которую увидит его CI |
| `dist/ui-kit/` после `ng build` | работает — это и есть вариант A из 3.0 |

То есть `npm link` не конкурирует с alias: он умеет подставить **собранный** пакет, а не исходники. Проверьте свой `projects/ui-kit/package.json` — если там только `name`, `version` и `peerDependencies`, средняя строка отпадает именно поэтому.

## 3.1.1 Почему для варианта B выбран именно alias

Если исходники всё-таки нужны, остаётся вопрос, как довести до них резолвер. Все способы через `node_modules` упираются в ограничение ①: аналоговский плагин исключает `/node_modules/` из трансформации, а вотчер Vite игнорирует `**/node_modules/**`.

| Способ | Реальный путь после резолва | Годится? |
|---|---|---|
| `npm link` / `yarn link` на исходники | `/repos/ui-kit/projects/ui-kit/…` (симлинк разыменован) | по пути — да, но упирается в отсутствие entry points (3.1) |
| `pnpm link` | `…/node_modules/.pnpm/…` | **нет** — `node_modules` в пути |
| `"file:../ui-kit"` в зависимостях | копия или симлинк в `node_modules` | ненадёжно, зависит от менеджера; меняет lock-файл |
| Yarn PnP | физического пути нет вообще | **нет** |
| `resolve.alias` на абсолютный путь | `/repos/ui-kit/projects/ui-kit/src/…` | **да, детерминированно** |

Alias выигрывает тем, что не зависит ни от пакетного менеджера, ни от полей `package.json` библиотеки, ни от значения `preserveSymlinks`, и не трогает `package.json`/lock — CI не увидит изменений в дереве зависимостей.

## 3.2 Почему alias дублируется в tsconfig `paths`

Это два независимых резолвера, и они не общаются:

- **`resolve.alias` (Vite)** — рантайм-резолв модулей в дев-сервере и сборке;
- **`paths` (TypeScript)** — резолв **типов** и построение `ts.Program`.

`@storybook/angular-vite` (в отличие от вебпачного `@storybook/angular`) `tsconfig.paths` в резолвер Vite **не переносит** — это прямо написано в его документации. Поэтому: alias — чтобы код собрался, `paths` — чтобы TS понимал, что `@acme/ui-kit` это те самые исходники, а не `.d.ts` из `node_modules` (иначе будет каша из двух версий типов).

Если в проекте уже стоит `vite-tsconfig-paths` (частый способ «уже настроенных aliases-резолвов»), то `paths` действительно превращаются в alias автоматически — но плагин по умолчанию ищет `tsconfig.json` в корне, а не наш `tsconfig.uikit-src.json`. Нужно указать явно:

```ts
tsconfigPaths({ projects: [UIKIT_SRC ? '.storybook/tsconfig.uikit-src.json' : '.storybook/tsconfig.json'] })
```

В этом случае блок `resolve.alias` из 2.2 можно не добавлять — но я бы всё равно оставил явный alias: он читается однозначно и не зависит от порядка плагинов.

## 3.3 Почему `dedupe` — самая частая точка отказа

Node-резолвинг ищет `node_modules` вверх **от папки импортирующего файла**. Файл `/repos/ui-kit/projects/ui-kit/src/button.component.ts` импортирует `@angular/core` → сначала проверяется `/repos/ui-kit/node_modules/@angular/core`. Он там почти наверняка есть (репозиторий библиотеки же собирается и тестируется). Итог — **два экземпляра Angular** в одном графе модулей.

Симптомы, по которым это опознаётся:

- `NG0203: inject() must be called from an injection context` в коде, где всё правильно;
- `NullInjectorError: No provider for X` при том, что провайдер точно объявлен;
- `NG0300`/дубли в DevTools, два разных `ɵɵdefineInjectable` для одного токена;
- `instanceof` возвращает `false` для объектов «того же» класса;
- RxJS: `TypeError: … is not a function` на операторах, если два экземпляра `rxjs`.

`resolve.dedupe` говорит Vite: эти пакеты всегда резолвить от корня текущего проекта, кто бы их ни импортировал. Это ровно тот сценарий, ради которого опция и существует.

Альтернативы, если dedupe почему-то не срабатывает:

1. явные alias на конкретные пакеты — `{ find: /^@angular\/core$/, replacement: resolve('node_modules/@angular/core') }` (грубее, но неотвратимее);
2. вообще не ставить `node_modules` в чекауте ui-kit — тогда все bare-импорты уйдут вверх и найдутся в проекте сторибука. Работает, но ломает возможность запускать сборку/тесты библиотеки в её репозитории;
3. `npm dedupe`/общий `node_modules` — не вариант для двух отдельных репозиториев.

Обратная сторона: если у библиотеки есть **собственные** зависимости, которых нет в проекте сторибука, — им наличие `node_modules` в чекауте ui-kit как раз помогает. Поэтому правило: `dedupe` — только для синглтонов (Angular, RxJS, tslib, zone.js, CDK), всё остальное пусть резолвится как резолвится.

## 3.4 Почему `server.fs.allow` и как понять, что дело в нём

Ограничение доступа к файлам вне root — это защита дев-сервера от чтения произвольных файлов ФС. Симптом ровно один и очень характерный: в Network — **403** на запрос вида `/@fs/repos/ui-kit/projects/ui-kit/src/....ts`, в консоли Vite — `The request url … is outside of Vite serving allow list`.

Тонкость, из-за которой ломают себе проект: **явно заданный `fs.allow` отменяет автоопределение workspace root**. То есть `allow: [uikitRoot]` вместо «добавил папку» означает «разрешил только эту папку», и перестанет отдаваться свой же исходник. Поэтому в 2.2 первым элементом стоит `searchForWorkspaceRoot(process.cwd())`.

## 3.5 Вторичные entry points ng-packagr

Если библиотека публикует `@acme/ui-kit/button`, `@acme/ui-kit/testing` и т.п., то в исходниках это отдельные папки со своим `ng-package.json`. Найти раскладку:

```bash
find ../ui-kit -name 'ng-package.json' -not -path '*/node_modules/*'
```

Типичные варианты:

| Раскладка исходников | Шаблон replacement |
|---|---|
| `projects/ui-kit/button/src/public-api.ts` | `projects/ui-kit/$1/src/public-api.ts` |
| `projects/ui-kit/src/button/index.ts` | `projects/ui-kit/src/$1/index.ts` |
| плоско, без вторичных точек | правило не нужно вовсе |

Проверять надо **каждый** вариант: промах в шаблоне даёт «Failed to resolve import» с почти правильным путём — легко проглядеть.

## 3.6 Что именно даёт HMR и чего не даёт

При `liveReload: true` меняется файл компонента → Angular пересобирает **только метаданные компонента** и шлёт `hmrUpdateCode`, рантайм подменяет их через `ɵɵreplaceMetadata`, дерево компонентов не пересоздаётся.

| Что поменяли | Что произойдёт |
|---|---|
| шаблон, инлайн-стиль, `templateUrl`/`styleUrls` | точечное HMR-обновление, состояние сохраняется |
| тело класса компонента (методы, сигналы, инпуты) | HMR-обновление метаданных; для части правок Angular принудительно пересоздаёт компонент |
| сервис, DI-провайдер, `InjectionToken` | full reload iframe |
| barrel/`public-api.ts`, структура импортов | full reload iframe |
| файл стори | HMR самого Storybook, стори перерисовывается |

Даже full reload здесь — это перезагрузка **iframe превью**, а не всего UI Storybook, и текущая стори восстанавливается из URL. По ощущениям — доли секунды против минут на пересборку пакета.

Если `liveReload: true` даёт артефакты (правка «не доезжает», компонент залипает в старом состоянии) — выключите его: получите обычный full-reload по изменению модуля, что для задачи «увидеть правку сразу» тоже полностью годится.

---
# Часть 4. Варианты под особенности конкретного проекта

## 4.1 Если `main.ts` трогать нельзя (политика, общий конфиг)

Сделайте **отдельный `configDir`** и пробросьте его опцией билдера:

```
.storybook-uikit-src/
├─ main.ts        →  import base from '../.storybook/main'; export default { ...base, viteFinal }
└─ preview.ts     →  export * from '../.storybook/preview';
```

```jsonc
"configurations": {
  "uikit-src": {
    "configDir": ".storybook-uikit-src",
    "tsConfig": ".storybook/tsconfig.uikit-src.json"
  }
}
```

Минус: глобы `stories` в базовом `main.ts` заданы относительно `.storybook` — их придётся переопределить в новом `main.ts`. Плюс: боевой конфиг остаётся нетронутым буквально, а не «нетронутым при пустой переменной».

## 4.2 Если пакетный менеджер — pnpm

Сам alias работает как обычно (мы не пользуемся линковкой), но:

- убедитесь, что нигде не выставлен `resolve.preserveSymlinks: true`;
- `dedupe` становится **обязательным**: у pnpm жёсткая изоляция, `@angular/core` в чекауте ui-kit — почти гарантированно физически другой файл;
- `node-linker=hoisted` в `.npmrc` не требуется, но с ним меньше сюрпризов с транзитивными зависимостями библиотеки.

## 4.3 Если Yarn PnP

Не заработает без `nodeLinker: node-modules`: у PnP нет физических путей к пакетам, а `server.fs.allow`/вотчер Vite оперируют путями ФС. Это единственная конфигурация, которую я бы назвал блокирующей.

## 4.4 Compodoc

`documentation.json` генерируется пресетом **один раз, если файла нет** — и он общий для обоих режимов. Отсюда два следствия:

- включив исходники ui-kit в tsconfig, вы получите argTypes и описания из **исходного** кода — обычно это лучше, чем из собранного пакета;
- при переключении режимов файл остаётся старым. Правило: **удалять `documentation.json` при смене режима**, либо ставить `compodoc: false` на конфигурации `uikit-src` (тогда автодоки берутся из того, что было сгенерировано боевым режимом).

Для большой библиотеки Compodoc по исходникам ощутимо удлиняет холодный старт — это и есть основной аргумент за `compodoc: false` в режиме отладки.

## 4.5 Если в базовом tsconfig заданы `rootDir` / `files` / `references`

- **`rootDir`** — поднять до общего предка (`../..`) или убрать в дочернем конфиге; иначе `TS6059: File is not under 'rootDir'`;
- **`files`** — работает так же, как `include`: **перезаписывается**, а не мержится;
- **project references (`composite: true`)** — исходники, подключённые через `include`, не участвуют в referenced-проектах; если базовый конфиг использует `references`, безопаснее в `tsconfig.uikit-src.json` от них отказаться (`"references": []`), потому что плагину нужна одна плоская программа, а не граф проектов.

## 4.6 Если раскладка репозиториев у каждого своя

Генерируйте tsconfig из шаблона в `tools/storybook-uikit-src.mjs` перед запуском `ng`:

```js
import { writeFileSync } from 'node:fs';

writeFileSync(TSCONFIG, JSON.stringify({
  extends: './tsconfig.json',
  compilerOptions: {
    baseUrl: '.',
    paths: { '@acme/ui-kit': [join(uikitRoot, 'projects/ui-kit/src/public-api.ts')] },
  },
  include: ['../src/**/*.stories.ts', './*.ts', join(uikitRoot, 'projects/ui-kit/**/*.ts')],
}, null, 2));
```

Файл — в `.gitignore`. Плата: конфиг перестаёт быть читаемым артефактом в репозитории.

## 4.7 Если часть сторей лежит в репозитории ui-kit

Добавьте глоб в `stories` под тем же флагом:

```ts
stories: [
  '../src/**/*.stories.@(ts|mdx)',
  ...(UIKIT_SRC ? [`${resolve(process.cwd(), UIKIT_SRC)}/projects/ui-kit/**/*.stories.ts`] : []),
],
```

и уберите `*.stories.ts` из `exclude` в `tsconfig.uikit-src.json`. `server.fs.allow` уже разрешает эту папку.

## 4.8 Глобальные стили/темы библиотеки

Если тема обычно подключается как `@use '@acme/ui-kit/styles/theme'`, в режиме исходников путь другой. Два способа:

1. `css.preprocessorOptions.scss.loadPaths` (как в 2.2) — SCSS начинает искать в исходниках;
2. опция билдера `styles` на конфигурации `uikit-src` — пресет фреймворка вставляет эти импорты в начало `preview.ts` (`preset.ts:269–305`), пути резолвятся относительно root проекта.

---
# Часть 5. Внедрение и диагностика

## 5.1 Порядок внедрения

1. Убедиться, что `ng run ui-storybook:storybook` работает **до** любых правок — это база сравнения.
2. Добавить `.storybook/tsconfig.uikit-src.json`, выправить `include` под свои глобы.
3. Добавить блок в `viteFinal` и `tools/storybook-uikit-src.mjs`.
4. `npm run storybook:src` → открыть стори любого компонента.
5. В DevTools → Network найти запрос `/@fs/.../button.component.ts` и убедиться, что отдаётся **скомпилированный** JS (видны `ɵɵdefineComponent`/`ɵcmp`), а не сырой TS с декораторами.
6. Поменять шаблон компонента в чекауте ui-kit → правка должна появиться без ручной перезагрузки.
7. Проверить, что `ng run ui-storybook:storybook` и `ng run ui-storybook:build-storybook` по-прежнему отрабатывают ровно как раньше.

## 5.2 Таблица симптомов

| Симптом | Причина | Что править |
|---|---|---|
| `contains Angular decorators but is not in the TypeScript program` | файл не попал в `rootNames` | `include` в `tsconfig.uikit-src.json`; проверить, что билдер получил именно этот tsconfig |
| В браузере видно сырой TS с `@Component` / ошибка про декораторы | путь модуля содержит `node_modules` (ограничение ①) | alias должен вести в чекаут напрямую; проверить `preserveSymlinks: false` |
| **403** на `/@fs/...` | путь вне allow-list | `server.fs.allow` + не забыть `searchForWorkspaceRoot()` |
| `Failed to resolve import "@acme/ui-kit/button"` | нет правила для вторичных entry points или неверный шаблон | см. 3.5 |
| `NG0203`, `NullInjectorError`, странные `instanceof` | два экземпляра Angular | `resolve.dedupe`, см. 3.3 |
| Правки не подхватываются, HMR молчит | файл не в вотчере (лежит в `node_modules`) либо не в графе модулей | то же, что во второй строке; проверить, что импорт реально идёт через alias |
| `Can't find stylesheet to import` в SCSS | нет путей поиска | `loadPaths` / `stylePreprocessorOptions.includePaths` |
| Автодоки/argTypes от старой версии | закешированный `documentation.json` | удалить файл или `compodoc: false`, см. 4.4 |
| Всё сломалось только на pnpm | реальный путь в `.pnpm/...` | не пользоваться линковкой, только alias; см. 4.2 |

## 5.3 Чем гарантируется, что CI не заденет

- `angular.json`: базовые `options` не меняются; добавляется только `configurations.uikit-src`, которая активируется явно третьим сегментом `ng run`. Если пошли путём с `--ts-config` — `angular.json` не меняется вовсе.
- `.storybook/main.ts`: весь новый код — под `if (!UIKIT_SRC) return cfg`. Без переменной окружения конфиг Vite идентичен прежнему. `liveReload` тоже завязан на флаг.
- `package.json`: существующие скрипты не трогаются, добавляется новый.
- `package.json`/lock: зависимости не меняются, `@acme/ui-kit` остаётся обычной зависимостью нужной версии.
- Новые файлы (`tsconfig.uikit-src.json`, `tools/*.mjs`) в боевом пути не читаются никем.

Проверка одной командой: `ng run ui-storybook:build-storybook` до и после — вывод должен совпасть.

---
# Ограничения, о которых стоит помнить

1. **Это режим отладки, а не эквивалент публикации.** Библиотека собирается сторибуковскими `compilerOptions`, в JIT, с выключенной по умолчанию проверкой типов (`disableTypeChecking: true` в плагине). `ng-packagr` (partial compilation, свои strict-флаги, свой `exports`) может поймать то, чего здесь не видно. Финальную проверку всё равно делать на собранном пакете.
2. **`@storybook/angular-vite` в статусе preview** — дефолты (`jit`, `liveReload`, набор `optimizeDeps.include`) могут измениться в минорной версии. Пин версии фреймворка снижает риск.
3. **Компиляция всей библиотеки целиком.** `include` тянет в программу все `.ts` библиотеки, а не только те, что нужны открытой стори. На больших ui-kit холодный старт заметно длиннее обычного. Если критично — сузить глоб до конкретной папки компонентов, над которой идёт работа.
4. **Расхождение версий.** Если в ui-kit уже используется API Angular новее, чем установлен в репозитории сторибука, режим исходников упадёт там, где собранный пакет работал бы (он собран под свою версию). Это не баг схемы, а честный сигнал о рассинхроне.

---
# Источники

- [Storybook for Angular with Vite — официальная документация](https://storybook.js.org/docs/get-started/frameworks/angular-vite) — требования (Angular ≥ 21, Vite ≥ 8), опции фреймворка, `viteFinal`, отсутствие автоматического переноса `tsconfig.paths`, `stylePreprocessorOptions`
- [`frameworks/angular-vite/src/preset.ts`](https://github.com/storybookjs/storybook/blob/next/code/frameworks/angular-vite/src/preset.ts) — инстанцирование аналоговского плагина, `optimizeDeps.include`, обработка `styles`/`stylePreprocessorOptions`
- [`frameworks/angular-vite/src/builders/start-storybook/schema.json`](https://github.com/storybookjs/storybook/blob/next/code/frameworks/angular-vite/src/builders/start-storybook/schema.json) — опции билдера, включая `tsConfig`
- [`@analogjs/vite-plugin-angular` v2.6.4](https://github.com/analogjs/analog/blob/main/packages/vite-plugin-angular/src/lib/angular-vite-plugin.ts) — фильтр `node_modules`, проверка членства в TS-программе, `liveReload`/HMR, дефолты опций
- [Vite — Server Options](https://vite.dev/config/server-options) — `server.fs.allow` и отключение автоопределения workspace root
- [`vite/src/node/utils.ts`](https://github.com/vitejs/vite/blob/v8.0.9/packages/vite/src/node/utils.ts), [`watch.ts`](https://github.com/vitejs/vite/blob/v8.0.9/packages/vite/src/node/watch.ts) — `ensureWatchedFile`, `mergeAlias`, дефолтный `ignored` вотчера
- [Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b) — v21 от 20.11.2025, zoneless по умолчанию

---

Связанные: [[Storybook]] · [[00 MOC — Модульные системы и загрузка кода]] · [[Резолвинг модулей в Node.js]] · [[Поле exports]] · [[Спецификаторы модулей]]
