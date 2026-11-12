Цель: собрать npm-пакет, который корректно резолвится из ESM, из CJS, из браузерного сборщика и из TypeScript — и убедиться в этом инструментально.

Время: 2–3 часа. Опирается на [[Поле exports]], [[Условия резолвинга]], [[Публикация пакета для ESM и CJS]].

# Шаг 1. Исходники

```
my-lib/
├── package.json
├── src/
│   ├── index.ts
│   ├── storage.node.ts
│   └── storage.browser.ts
└── tsconfig.json
```

```ts
// src/storage.node.ts
import { readFile, writeFile } from 'node:fs/promises';
export async function get(key: string) {
  try { return await readFile(`/tmp/${key}`, 'utf8'); } catch { return null; }
}
export async function set(key: string, value: string) {
  await writeFile(`/tmp/${key}`, value);
}
```

```ts
// src/storage.browser.ts
export async function get(key: string) { return localStorage.getItem(key); }
export async function set(key: string, value: string) { localStorage.setItem(key, value); }
```

```ts
// src/index.ts
export { get, set } from '#storage';
export const VERSION = '1.0.0';
```

Обратите внимание на `#storage` — внутренний алиас через [[Поле imports и внутренние алиасы]]. Реализация выбирается на этапе резолвинга, без единого `if (typeof window)`.

# Шаг 2. Сборка

Самый быстрый путь — `tsup`:

```bash
npm i -D tsup typescript
```

```ts
// tsup.config.ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts', 'src/storage.node.ts', 'src/storage.browser.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
```

Получите `dist/*.js` (ESM), `dist/*.cjs` (CJS), `dist/*.d.ts`.

# Шаг 3. package.json

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "imports": {
    "#storage": {
      "browser": "./src/storage.browser.ts",
      "node": "./src/storage.node.ts",
      "default": "./src/storage.browser.ts"
    }
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": "./dist/index.js",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "sideEffects": false
}
```

Проверьте себя по каждому пункту:

- [ ] `types` первым в каждой ветке — иначе TypeScript возьмёт `.js`;
- [ ] `default` последним — всё после него недостижимо;
- [ ] `require` указывает на `.cjs`, а не на `.js` (при `type: module` это был бы `ERR_REQUIRE_ESM`);
- [ ] `./package.json` экспортирован явно;
- [ ] `files` ограничивает архив.

# Шаг 4. Проверка инструментами

```bash
npx publint
npx @arethetypeswrong/cli .
npm pack --dry-run
```

`publint` проверяет соответствие условий реальным форматам файлов. `arethetypeswrong` — разрешение типов во всех режимах `moduleResolution`. Оба стоит внести в CI.

**Задание: сломайте намеренно и посмотрите на диагностику.**

1. Поменяйте `types` и `import` местами → что скажет `arethetypeswrong`?
2. Укажите в `require` файл `./dist/index.js` → что скажет `publint`?
3. Поставьте `default` первым → заметит ли кто-нибудь?

Третий пункт особенно полезен: он показывает, какие ошибки инструменты ловят, а какие нет.

# Шаг 5. Проверка потребления

```bash
npm pack                       # получите my-lib-1.0.0.tgz
mkdir /tmp/consumer && cd /tmp/consumer && npm init -y
npm i /path/to/my-lib-1.0.0.tgz
```

**ESM:**
```bash
node --input-type=module -e "import * as lib from 'my-lib'; console.log(Object.keys(lib))"
```

**CJS:**
```bash
node -e "console.log(Object.keys(require('my-lib')))"
```

**Сборщик:** создайте минимальный Vite-проект, импортируйте пакет, соберите и найдите в выводе, какая ветка попала в бандл.

Ключевая проверка: **в браузерном бандле не должно быть `node:fs`**. Если он там — условие `browser` не сработало, и вы получите ошибку резолвинга Node-модуля в браузере.

# Шаг 6. Subpath-экспорты

Добавьте прямой доступ к подмодулю:

```json
{
  "exports": {
    ".": { "...": "..." },
    "./storage": {
      "types": "./dist/storage.browser.d.ts",
      "browser": "./dist/storage.browser.js",
      "node": "./dist/storage.node.js"
    }
  }
}
```

Проверьте, что `import 'my-lib/storage'` работает, а `import 'my-lib/dist/storage.node.js'` — **нет**:

```
ERR_PACKAGE_PATH_NOT_EXPORTED
```

Это инкапсуляция в действии. Осознайте обратную сторону: если бы потребители раньше лезли в `dist`, вы бы им сейчас всё сломали.

# Шаг 7. Проверка tree shaking

Соберите тестовое приложение, импортирующее только `VERSION`:

```js
import { VERSION } from 'my-lib';
console.log(VERSION);
```

Найдите в собранном бандле упоминание `localStorage`. Не должно быть — `sideEffects: false` разрешил выбросить неиспользуемый модуль.

Теперь уберите `sideEffects` из `package.json`, пересоберите и сравните. Разница — это цена одного поля. См. [[sideEffects в package.json]].

# Чеклист освоенного

- [ ] Понимаю, почему порядок ключей в `exports` — семантика, а не стиль
- [ ] Умею выбрать реализацию по платформе без рантайм-проверок
- [ ] Знаю, что `publint` ловит, а что нет
- [ ] Проверяю пакет всеми четырьмя способами потребления перед публикацией
- [ ] Понимаю, что добавление `exports` — breaking change

# Связанные заметки

- [[Поле exports]]
- [[Условия резолвинга]]
- [[Поле imports и внутренние алиасы]]
- [[Публикация пакета для ESM и CJS]]
- [[sideEffects в package.json]]
- [[00 MOC — Модульные системы и загрузка кода]]
