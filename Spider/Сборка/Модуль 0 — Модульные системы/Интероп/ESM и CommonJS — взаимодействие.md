Два формата с несовместимой семантикой вынуждены сосуществовать в одном графе. Правила их стыковки — источник большинства непонятных ошибок сборки.

Фундаментальная асимметрия: **ESM асинхронен и статичен, CJS синхронен и динамичен**. Загрузить синхронное из асинхронного просто; наоборот — принципиально сложно.

# ESM импортирует CommonJS

Работает и в Node, и в сборщиках.

```js
// legacy.cjs
module.exports = { add: (a, b) => a + b };
module.exports.version = '1.0';
```

```js
// app.mjs
import legacy from './legacy.cjs';       // весь module.exports
console.log(legacy.add(1, 2));

import { add } from './legacy.cjs';      // может работать, а может нет
```

## Правило default

**`default` — это всегда `module.exports` целиком.** Мнемоника: `import X from 'cjs'` эквивалентно `const X = require('cjs')`.

## Named exports определяются эвристикой

`module.exports` — обычный объект, который заполняется **в рантайме**. Список его ключей нельзя узнать, не выполнив код. Но ESM требует список экспортов **до выполнения** (фаза instantiation, см. [[Фазы загрузки ESM]]).

Выход — статический анализ. Node использует `cjs-module-lexer`: парсит исходник и ищет распознаваемые шаблоны присваивания.

Распознаётся:
```js
exports.foo = ...;
module.exports.bar = ...;
module.exports = { a, b, c };
Object.defineProperty(exports, 'x', { get() {...} });
```

Не распознаётся:
```js
const key = 'dynamic';
exports[key] = ...;                    // вычисляемый ключ
Object.assign(exports, someObject);    // источник неизвестен
if (cond) exports.maybe = ...;         // условно (иногда всё же ловится)
```

Отсюда ошибка:

```
SyntaxError: The requested module './legacy.cjs' does not provide an export named 'add'
```

Обходной путь — импортировать default и разобрать вручную:

```js
import legacy from './legacy.cjs';
const { add } = legacy;   // работает всегда
```

Это надёжный приём, когда named-импорт из CJS-пакета не заводится.

## `module.exports` — функция или класс

```js
// old-lib.cjs
module.exports = function doWork() {};
module.exports.helper = function () {};
```

```js
import doWork from 'old-lib';        // ✅ функция
import { helper } from 'old-lib';    // ✅ обычно распознаётся
```

Named-импорты работают, потому что функция — тоже объект со свойствами.

# CommonJS импортирует ESM

Здесь исторический запрет: ESM асинхронен, `require` синхронен.

```js
const esm = require('./module.mjs');
// Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

Классический обход — динамический импорт:

```js
async function main() {
  const esm = await import('./module.mjs');   // работает в CJS
  esm.doWork();
}
```

[[Динамический import()]] возвращает промис и потому совместим с асинхронной природой ESM.

В современных версиях Node запрет частично снят — см. [[require(esm) в Node.js]].

# Что ESM даёт CJS и чего не даёт

Импортируя ESM, CJS получает namespace-объект. Учтите:

- **default лежит в `.default`**: `const { default: fn } = await import('./mod.mjs')`;
- **живые связывания сохраняются** — свойства namespace отражают изменения (см. [[Live bindings]]);
- **namespace запечатан** — присвоить свойство нельзя.

# Транспиляторы: `__esModule` и `esModuleInterop`

Отдельный слой путаницы. Когда TypeScript/Babel компилируют ESM в CJS, они помечают результат:

```js
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = ...;
```

Флаг говорит потребителю: «это был ESM, `default` лежит в свойстве `default`».

Проблема возникает при импорте **настоящего** CJS-модуля без флага:

```ts
import express from 'express';   // express — CJS, module.exports = функция
```

Без `esModuleInterop` TypeScript скомпилирует это в `express_1.default(...)` → `undefined is not a function`. С `esModuleInterop: true` компилятор добавляет хелпер `__importDefault`, который проверяет `__esModule` и при его отсутствии оборачивает объект в `{ default: mod }`.

**Практический вывод: `esModuleInterop: true` нужен почти всегда.** Он включён по умолчанию в новых конфигах TS. Связанный флаг `allowSyntheticDefaultImports` отключает только ошибку типов, не меняя вывод — он полезен, когда транспиляцией занимается не tsc, а сборщик.

Опасность: код, отлаженный с `esModuleInterop` и собранный в CJS, может вести себя иначе при переходе на нативный ESM, где никакого хелпера нет. Это одна из причин расхождений между сборкой и `node file.mjs`.

# Как это делают сборщики

**webpack** поддерживает оба формата нативно, конвертируя CJS в свой внутренний реестр.

**Rollup** понимает только ESM; CJS требует `@rollup/plugin-commonjs`, который конвертирует в ESM на лету. Плагин делает лучшее, на что способен статический анализ, — отсюда предупреждения вида `"X" is not exported by "node_modules/..."`.

**Vite** решает это на этапе `optimizeDeps` (pre-bundling): esbuild заранее конвертирует CJS-зависимости в ESM и кладёт результат в `node_modules/.vite`. Отсюда:

- первый запуск dev-сервера медленнее (идёт пре-бандлинг);
- новая зависимость вызывает перезапуск оптимизации;
- проблемные пакеты лечатся через `optimizeDeps.include` / `exclude`;
- **поведение dev и prod может расходиться**, потому что конвертацию делают разные инструменты (esbuild в dev, Rollup в prod).

Это объясняет львиную долю «в dev работает, в prod нет».

# Практический чеклист

- Named-импорт из CJS не работает → импортируйте default и деструктурируйте.
- `ERR_REQUIRE_ESM` → `await import()` либо обновить Node.
- `X is not a function` после сборки → проверьте `esModuleInterop` и наличие `.default`.
- Пакет ломается только в dev у Vite → `optimizeDeps.include`.
- Пишете библиотеку → не смешивайте форматы в одном графе, см. [[Dual package hazard]].

# Связанные заметки

- [[CommonJS]]
- [[require(esm) в Node.js]]
- [[Dual package hazard]]
- [[Динамический import()]]
- [[Поле type и расширения mjs cjs]]
- [[Диагностика ошибок модульных систем]]
- [[00 MOC — Модульные системы и загрузка кода]]
