## Hoisting (поднятие)

**Hoisting** — не физическое перемещение кода, а следствие того, как движок обрабатывает область видимости: перед выполнением кода создаётся **лексическое окружение**, в котором **регистрируются все объявления** этой области.

Что происходит на этапе создания:

| Объявление | Поднимается | Инициализируется | Доступ до строки объявления |
|---|---|---|---|
| `var x` | да | значением `undefined` | `undefined` |
| `let x` / `const x` | **да** | нет | **ReferenceError (TDZ)** |
| `function f() {}` | да | **целиком телом функции** | работает |
| `class C {}` | да | нет | ReferenceError (TDZ) |
| `var f = function(){}` | как var | `undefined` | `TypeError: f is not a function` |

```js
console.log(v);      // undefined — var поднят и проинициализирован
var v = 1;

console.log(l);      // ReferenceError: Cannot access 'l' before initialization
let l = 1;

hoisted();           // работает — объявление функции поднято целиком
function hoisted() { console.log('ok'); }

notYet();            // TypeError: notYet is not a function
var notYet = function () {};
```

## Temporal Dead Zone (TDZ)

**TDZ** — промежуток от начала блока до строки инициализации переменной, объявленной через `let`, `const` или `class`. Внутри него переменная существует, но обращение к ней бросает `ReferenceError`.

```js
{
  // TDZ для x начинается здесь
  console.log(typeof x); // ReferenceError — даже typeof не спасает
  let x = 5;             // TDZ заканчивается
  console.log(x);        // 5
}
```

Зачем TDZ нужен: он превращает ошибку «использовал до объявления» из молчаливого `undefined` в явное исключение. Особенно это важно для `const`, где значение обязано быть присвоено при объявлении.

Тонкий пример TDZ:

```js
let y = 1;
{
  console.log(y); // ReferenceError, а не 1 — внутренняя y уже затенила внешнюю
  let y = 2;
}
```

## Источники

- [Hoisting — MDN](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)
- [let — Temporal dead zone — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz)
- [let and const declarations — ECMA-262](https://tc39.es/ecma262/#sec-let-and-const-declarations)

---

## Связанные заметки

- [[Область видимости в JavaScript]]
- [[var, let и const]]

