## Область видимости (scope)

**Область видимости** — участок кода, в котором идентификатор доступен. В JavaScript она **лексическая (статическая)**: определяется местом объявления в исходном коде, а не местом вызова.

Виды областей:

- **Глобальная** — вне любых функций и блоков.
- **Функциональная** — тело функции; создаётся при каждом вызове.
- **Блочная** — внутри `{ }` (if, for, while, просто блок). Работает для `let`, `const`, `class`, но **не для `var`**.
- **Модульная** — верхний уровень ES-модуля не является глобальным.

**Цепочка областей видимости (scope chain):** при обращении к переменной движок ищет её в текущей области, затем во внешней, и так до глобальной. Не нашёл — `ReferenceError` (или неявная глобальная переменная в нестрогом режиме при присваивании).

```js
const a = 'global';
function outer() {
  const b = 'outer';
  function inner() {
    const c = 'inner';
    console.log(a, b, c); // видит все три по цепочке
  }
  inner();
}
```

## Источники

- [Scope — MDN](https://developer.mozilla.org/en-US/docs/Glossary/Scope)
- [Lexical Environments — ECMA-262](https://tc39.es/ecma262/#sec-lexical-environments)
- [Strict mode — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)

---

## Связанные заметки

- [[Hoisting и TDZ]]
- [[var, let и const]]

