# Общее

Для добавления в Angular достаточно просто
[`ng add angular-eslint`](https://github.com/angular-eslint/angular-eslint)

Плагины это npm модули, содержащие правила, конфигурации, процессоры и языки.

ESLint работает с AST, в которое код преобразовывает парсер Espree

Процессоры извлекают код из других файлов, а также манипулируют над кодом прежде чем передать его линтеру

Конфигурация ESLint возможна через конфигурационные файлы (`eslint.config.js`) или через комментарии в самом коде.

В конфигурации можно настроить:
1. Глобальные переменные для скрипта
2. Правила
3. Плагины (включающие в себя правила, конфиги и многое другое для линта)

# Конфигурационные файлы

Если указан `type=module` в package.json, то ESM формат:

```tsx
// eslint.config.js
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		rules: {
			semi: "error",
			"prefer-const": "error",
		},
	},
]);

```

Иначе формат CommonJS:

```tsx
// eslint.config.js
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
	{
		rules: {
			semi: "error",
			"prefer-const": "error",
		},
	},
]);

```

