Цель: своими руками создать ситуацию с двумя экземплярами пакета, увидеть симптомы, научиться диагностировать и починить тремя разными способами. После этого «два React» перестанут быть загадкой.

Время: 1–2 часа. Теория — [[Dual package hazard]], [[Реестр модулей и singleton-семантика]].

# Шаг 1. Пакет с состоянием

```
hazard-lib/
├── package.json
└── dist/
    ├── index.mjs
    └── index.cjs
```

```js
// dist/index.mjs
const instanceId = Math.random().toString(36).slice(2, 8);
console.log('[hazard-lib] ESM-экземпляр', instanceId);

const registry = new Map();
export class Token {}
export function register(key, value) { registry.set(key, value); }
export function get(key) { return registry.get(key); }
export function whoami() { return `esm:${instanceId}`; }
```

```js
// dist/index.cjs
const instanceId = Math.random().toString(36).slice(2, 8);
console.log('[hazard-lib] CJS-экземпляр', instanceId);

const registry = new Map();
class Token {}
function register(key, value) { registry.set(key, value); }
function get(key) { return registry.get(key); }
function whoami() { return `cjs:${instanceId}`; }
module.exports = { Token, register, get, whoami };
```

```json
{
  "name": "hazard-lib",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

Обратите внимание: `registry` и `Token` объявлены в **каждом** файле отдельно. Это и есть носители состояния и идентичности.

# Шаг 2. Воспроизвести

```
consumer/
├── package.json          { "type": "module" }
├── main.mjs
└── legacy.cjs
```

```js
// legacy.cjs — имитирует зависимость, которую вы не контролируете
const lib = require('hazard-lib');
lib.register('from-cjs', 'значение из CJS');
module.exports = {
  readIt: () => lib.get('from-cjs'),
  makeToken: () => new lib.Token(),
  who: () => lib.whoami(),
};
```

```js
// main.mjs
import { register, get, Token, whoami } from 'hazard-lib';
import legacy from './legacy.cjs';

register('from-esm', 'значение из ESM');

console.log('ESM видит своё:      ', get('from-esm'));
console.log('ESM видит CJS-запись:', get('from-cjs'));      // undefined
console.log('CJS видит своё:      ', legacy.readIt());
console.log('who ESM:', whoami(), '| who CJS:', legacy.who());

const t = legacy.makeToken();
console.log('instanceof Token:', t instanceof Token);        // false
```

```bash
npm i ./hazard-lib
node main.mjs
```

Вывод:

```
[hazard-lib] ESM-экземпляр a1b2c3
[hazard-lib] CJS-экземпляр d4e5f6      ← два сообщения = две копии
ESM видит своё:       значение из ESM
ESM видит CJS-запись: undefined         ← состояние не разделяется
CJS видит своё:       значение из CJS
who ESM: esm:a1b2c3 | who CJS: cjs:d4e5f6
instanceof Token: false                 ← идентичность типов сломана
```

Это ровно то, что происходит с React, RxJS и любой библиотекой с реестром. Именно `instanceof: false` даёт «Invalid hook call» и «контекст не найден».

# Шаг 3. Второй путь — разные версии в дереве

Формат не единственная причина. Соберите:

```
consumer/node_modules/
├── shared/                        (v2.0.0)
├── lib-a/
│   └── node_modules/shared/       (v1.0.0)
```

Достигается тем, что `lib-a` объявляет `"shared": "1.0.0"`, а корень — `"shared": "2.0.0"`. Установите и посмотрите:

```bash
npm ls shared
```

Здесь [[Резолвинг модулей в Node.js|подъём по node_modules]] находит разные файлы для разных импортёров — при полностью одинаковом формате.

# Шаг 4. Диагностика

Отработайте инструменты на созданной проблеме.

```bash
npm ls hazard-lib          # копии в дереве
npm why hazard-lib         # кто притянул
```

Маркер в рантайме (то, что вы уже сделали через `console.log` с `instanceId`) — самый универсальный приём: работает и в собранном минифицированном бандле.

Для браузерной сборки: соберите Vite-проект с этой библиотекой и найдите строку `[hazard-lib]` в выводе. Дважды — две копии в бандле.

# Шаг 5. Три способа починки

## А. Общее состояние в CJS-ядре

```js
// dist/state.cjs — единственный носитель
const registry = new Map();
class Token {}
module.exports = { registry, Token };
```

```js
// dist/index.mjs
import state from './state.cjs';
export const Token = state.Token;
export function register(k, v) { state.registry.set(k, v); }
export function get(k) { return state.registry.get(k); }
```

```js
// dist/index.cjs
const state = require('./state.cjs');
module.exports = {
  Token: state.Token,
  register: (k, v) => state.registry.set(k, v),
  get: (k) => state.registry.get(k),
};
```

Перезапустите — состояние общее, `instanceof` работает. Обёрток две, ядро одно.

## Б. Отказ от dual

Уберите условие `require`, оставьте только ESM. Потребитель на Node 22+ всё равно сможет `require` — см. [[require(esm) в Node.js]]. Самое чистое решение, если аудитория позволяет.

## В. Принудительный резолвинг у потребителя

Когда библиотеку вы не контролируете:

```js
// vite.config.ts
resolve: {
  dedupe: ['hazard-lib'],
  alias: { 'hazard-lib': path.resolve(__dirname, 'node_modules/hazard-lib/dist/index.mjs') }
}
```

```json
// package.json — для дерева зависимостей
{ "overrides": { "hazard-lib": "1.0.0" } }
```

Проверьте, что после этого сообщение о загрузке появляется один раз.

# Шаг 6. Перенос на реальный кейс

Возьмите свой рабочий проект и проверьте:

```bash
npm ls react react-dom       # или angular/core, rxjs — что актуально
npm ls rxjs
```

Если видите несколько версий — вы нашли потенциальную проблему до того, как она проявилась. Соберите прод-бандл и поищите дубли анализатором (`source-map-explorer`, `rollup-plugin-visualizer`).

# Чеклист освоенного

- [ ] Могу за 5 минут воспроизвести два экземпляра пакета
- [ ] Узнаю симптомы: `instanceof` false, потерянное состояние, раздутый бандл
- [ ] Умею найти копии через `npm ls` / `npm why` и через маркер в рантайме
- [ ] Знаю три способа починки и когда какой применим
- [ ] Понимаю, почему `peerDependencies` для фреймворков обязательны

# Связанные заметки

- [[Dual package hazard]]
- [[Реестр модулей и singleton-семантика]]
- [[Резолвинг модулей в Node.js]]
- [[Условия резолвинга]]
- [[Публикация пакета для ESM и CJS]]
- [[00 MOC — Модульные системы и загрузка кода]]
