## Связь

`async/await` — **синтаксический сахар над промисами**, а не отдельный механизм.

- Функция, помеченная `async`, **всегда возвращает промис**. Возврат обычного значения оборачивается в `Promise.resolve(value)`; брошенное исключение — в `Promise.reject(error)`.
- `await` **разворачивает** промис: приостанавливает выполнение функции до его разрешения и возвращает значение (или бросает исключение при отклонении).

```js
async function f() { return 1; }
f();                       // Promise { 1 }
f().then(v => v);          // 1

// эквивалентные записи
const getUser = () => fetch('/api/user').then(r => r.json());
const getUser2 = async () => (await fetch('/api/user')).json();
```

## Что происходит при await

Механика по шагам:

1. Выражение справа от `await` вычисляется. Если это не промис, оно оборачивается через `Promise.resolve()`.
2. Выполнение функции **приостанавливается**; её состояние (локальные переменные, точка остановки) сохраняется. Фрейм снимается со стека вызовов — **поток не блокируется**, движок продолжает выполнять остальной код.
3. Продолжение функции регистрируется как **микрозадача**, привязанная к разрешению промиса.
4. Когда промис выполнен, движок помещает продолжение в очередь микрозадач. Оно выполнится после текущей синхронной работы, до следующей макрозадачи.
5. При отклонении промиса `await` **бросает** ошибку в точке остановки — её можно поймать обычным `try/catch`.

Под капотом это близко к генераторам: async-функция — это, по сути, генератор, автоматически «прокручиваемый» рантаймом при разрешении промисов.

Важно: **код до первого `await` выполняется синхронно**:

```js
async function f() {
  console.log('A');          // синхронно, при вызове
  await null;
  console.log('B');          // микрозадача
}
f();
console.log('C');
// A, C, B
```

## Преимущества над .then()

**Читаемость** — асинхронный код выглядит как синхронный.

**Естественные конструкции языка**: `try/catch/finally`, `if`, циклы, `return` работают привычно. С `.then()` цикл по асинхронным операциям требует ручного сведения (`reduce`), а с `await` пишется тривиально.

**Отладка** — точки останова и пошаговое выполнение работают, стек вызовов информативнее (async stack traces).

**Промежуточные значения** доступны без вложенности:

```js
// с then значения из ранних звеньев приходится «протаскивать»
.then(user => getOrders(user).then(orders => ({ user, orders })))

// с await всё в одной области
const user = await getUser();
const orders = await getOrders(user.id);
render(user, orders);
```

## Обработка ошибок

**try/catch** — основной механизм:

```js
async function load() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    logger.error(err);
    throw new Error('Не удалось загрузить данные', { cause: err }); // проброс с контекстом
  } finally {
    hideSpinner();               // выполнится всегда
  }
}
```

**Ошибка внутри async-функции превращается в отклонённый промис.** Это значит, что вызывающий код обязан её обработать:

```js
load().catch(handle);        // или await внутри другого try/catch
```

**Тонкость с `return` vs `return await` в try:**

```js
try { return fetchData(); }        // ошибка НЕ попадёт в catch — промис вернётся наружу
try { return await fetchData(); }  // ошибка попадёт в catch
```

**Ошибки в fire-and-forget вызовах.** Если async-функцию вызвали без `await` и без `.catch()`, отклонение станет необработанным:

```js
sendAnalytics();                     // потенциальный unhandledrejection
void sendAnalytics().catch(() => {}); // явно подавили
```

**Ошибки в колбэках не ловятся внешним try/catch:**

```js
try {
  setTimeout(() => { throw new Error('boom'); }, 0); // НЕ поймается
} catch (e) {}
```

Потому что колбэк выполняется в другом «тике», когда try-блок давно завершён.

**forEach и async** — та же проблема:

```js
items.forEach(async (item) => { await save(item); });  // не ждёт, ошибки теряются
for (const item of items) await save(item);            // последовательно и корректно
await Promise.all(items.map(save));                    // параллельно и корректно
```

## Последовательность и параллельность

```js
// последовательно — суммарно 3 секунды
const a = await taskA(); // 1s
const b = await taskB(); // 1s
const c = await taskC(); // 1s

// параллельно — 1 секунда
const [a, b, c] = await Promise.all([taskA(), taskB(), taskC()]);
```

Последовательность нужна только когда следующий шаг зависит от результата предыдущего. Обратите внимание: промисы **запускаются в момент создания**, а не в момент `await`, поэтому такой вариант тоже параллелен:

```js
const pa = taskA(), pb = taskB();   // обе стартовали
const a = await pa, b = await pb;
```

Если нужно, чтобы ошибка одной задачи не отменяла остальные — `Promise.allSettled`.

## Отмена

Промисы не отменяемы. Для прерывания используется `AbortController`:

```js
const controller = new AbortController();
const t = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch(url, { signal: controller.signal });
} catch (e) {
  if (e.name === 'AbortError') console.log('Отменено по таймауту');
} finally { clearTimeout(t); }
```

Также существует `AbortSignal.timeout(5000)`.

## Top-level await

В ES-модулях `await` можно использовать на верхнем уровне без обёртки в async-функцию. Это откладывает выполнение модулей-импортёров, поэтому применять его следует осознанно.

## Асинхронная итерация

```js
for await (const chunk of stream) {
  process(chunk);
}
```

Работает с асинхронными генераторами (`async function*`) и потоками — удобно для обработки данных по мере поступления.

---

---

## Источники

- [async function — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [await — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
- [Faster async functions and promises — V8](https://v8.dev/blog/fast-async)
- [AbortSignal.timeout() — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
- [Top-level await — ECMA-262](https://tc39.es/ecma262/#sec-module-semantics)
