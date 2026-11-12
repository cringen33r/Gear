## var, let, const

**Область видимости.** `var` — функциональная (или глобальная), игнорирует блоки. `let`/`const` — блочные.

```js
function f() {
  if (true) { var a = 1; let b = 2; }
  console.log(a); // 1
  console.log(b); // ReferenceError
}
```

**Повторное объявление.** `var` можно объявить дважды в одной области — молча. `let`/`const` — `SyntaxError`.

**Присваивание.** `var` и `let` можно переприсваивать, `const` — нет. Важно: **`const` запрещает переприсваивание связывания, а не мутацию значения**:

```js
const obj = { a: 1 };
obj.a = 2;          // разрешено — меняем содержимое
obj = {};           // TypeError: Assignment to constant variable

const frozen = Object.freeze({ a: 1 }); // поверхностная заморозка
```

**Глобальный объект.** `var` на верхнем уровне скрипта создаёт свойство `globalThis`; `let`/`const` — нет.

```js
var g = 1;  console.log(globalThis.g); // 1
let h = 1;  console.log(globalThis.h); // undefined
```

## Классическая задача с циклом

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 3, 3, 3 — одна переменная i на весь цикл, к моменту таймаута она равна 3

for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 0, 1, 2 — let создаёт НОВОЕ связывание на каждой итерации
```

До ES2015 это чинили IIFE, создающей отдельную область на итерацию:

```js
for (var i = 0; i < 3; i++) (function (j) { setTimeout(() => console.log(j), 0); })(i);
```

## Практические рекомендации

- По умолчанию **`const`**; `let` — только когда переменную действительно нужно переприсваивать; **`var` не использовать**.
- Объявлять переменные как можно ближе к месту использования и в минимальной необходимой области.
- Всегда работать в строгом режиме (`'use strict'`, модули включают его автоматически) — он запрещает неявные глобальные переменные.

---

## Источники

- [var — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var)
- [let — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [const — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)

---

## Связанные заметки

- [[Область видимости в JavaScript]]
- [[Hoisting и TDZ]]

