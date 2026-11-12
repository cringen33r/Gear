# Установка

1. `ng add angular-eslint`
Просто добавляет нужные плагины, билдеры и прочее ([github](https://github.com/angular-eslint/angular-eslint?tab=readme-ov-file#packages-included-in-this-project)). Вроде бы достаточен для проекта.


2. `pnpm install --save-dev prettier eslint-config-prettier stylelint stylelint-config-standard-scss stylelint-config-recess-order stylelint-config-sass-guidelines`

`stylelint-config-standard`  нужно указать конкретный препроцессор

`eslint-config-prettier`
Отключение *правил форматирования* в ESLint для предотвращения конфликтов. Таким образом, чёткое разделение обязанностей по форматированию и анализу кода. *Предпочтительный подход.*
`eslint-plugin-prettier`
Встраивание Prettier как *правило* в ESLint, таким образом ошибки Prettier трактуются как ошибки ESLint. 
- Легко, поскольку не нужно настраивать новую инфраструктуру, а можно встроить в уже существующую. 
- Работает более медленно
- Ошибки форматирования показываются всегда, нагружая экран
- Неочевидно, что ошибки Prettier отображаются как ESLint
*Не следует использовать.*


> [!INFO] `stylelint-config-prettier`
> В stylelint v15 произошёл отказ от всех правил форматирования стилей, потому данный плагин перестал быть нужным для версий 15 и выше


Еще есть какие-то
`prettier-stylelint`
`prettier-eslint`
Которые вообще хуй пойми зачем нужны, поскольку весь их смысл в том, что они добавляют что сначала запускается Prettier а после него уже линтер. Того же самого можно добиться через скрипт в npm, а эта тема еще и медленнее работает.

`stylelint-config-standard` это стандартные рекомендуемые правила.

# Базовая настройка

1. Создать .prettierrc (конфигурация базовая)
```json
{
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "trailingComma": "es5",
  "bracketSameLine": true,
  "printWidth": 80,
  "endOfLine": "auto"
}
```
2. Создать stylelint.config.js
```tsx
/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard-scss"]
};
```
2. Создать .prettierignore и .stylelintignore (содержание равно .gitignore)
3. Добавить `eslint-config-prettier` в конфигурацию ESLint в раздел "расширяет"
```tsx
const prettier = require("eslint-config-prettier");
module.exports = tseslint.config(
  {
    extends: [
	  ...,
      prettier,
    ],
```

4. extensions.json

```json
{
  "recommendations": [
    "angular.ng-template",
    "johnpapa.angular-essentials",
    "streetsidesoftware.code-spell-checker",
    "stylelint.vscode-stylelint"
  ]
}
```

5. settings.json
```json
{
  "editor.lineNumbers": "on",
  "editor.trimAutoWhitespace": true,
  "editor.tabSize": 2,
  // Основные настройки форматирования
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  // Настройки для TypeScript (Angular)
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": "always",
      "source.fixAll.eslint": "always"
    }
  },
  // Настройки для HTML (Angular шаблоны)
  "[html]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "always"
    }
  },
  // Общие действия при сохранении  
  "editor.codeActionsOnSave": {
    "source.organizeImports": "always"
  },
  // Отключение встроенной валидации CSS
  "css.validate": false,
  "scss.validate": false,
  "less.validate": false,
  // Stylelint настройки
  "stylelint.validate": ["css", "scss"],
  "editor.formatOnSaveMode": "modificationsIfAvailable"
}
```

6. Установка Husky
`npx husky init`
после чего в `.husky/pre-commit` меняем на `npm run lint`

7. Установка commitlint
`npm install --save-dev @commitlint/config-angular @commitlint/cli`
после чего в .commintlintrc.json

```json
{
  "extends": ["@commitlint/config-angular"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "hotfix",
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test"
      ]
    ]
  }
}
```

в `.husky/commit-msg` добавить ```
npx --no -- commitlint --edit ${1}