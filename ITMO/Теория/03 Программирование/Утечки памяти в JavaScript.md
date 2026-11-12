## Утечки памяти: механизм

Сборщик мусора в JS работает по достижимости: объект удаляется, если на него нет достижимых ссылок. Замыкание удерживает **всё окружение**, поэтому «живая» функция может держать в памяти большие объекты, которые давно не нужны.

**Типичные сценарии утечек:**

**1. Обработчик события, который не снят.** Слушатель держит замыкание, замыкание держит DOM-узел и связанные данные; узел удалён из документа, но остаётся в памяти (detached DOM node).

```js
function attach() {
  const bigData = new Array(1e6).fill('x');
  const el = document.getElementById('btn');
  el.addEventListener('click', () => console.log(bigData.length)); // держит bigData навсегда
}
```

Решение — снимать слушатели:

```js
const controller = new AbortController();
el.addEventListener('click', handler, { signal: controller.signal });
// позже
controller.abort();   // снимает все слушатели, привязанные к сигналу
```

**2. Незакрытые таймеры и интервалы.** `setInterval` живёт вечно, пока не вызван `clearInterval`, и удерживает своё замыкание.

```js
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);   // обязательная очистка
}, []);
```

**3. Бесконечно растущий кеш.** Мемоизация без ограничения размера — утечка по определению. Решение: LRU-кеш с лимитом, TTL или `WeakMap`, если ключ — объект.

**4. Глобальные структуры, накапливающие ссылки.** Массив подписчиков, из которого никто не удаляется.

**5. Циклические ссылки между замыканием и DOM.** Современный mark-and-sweep GC с циклами справляется, но если один из участников достижим из корня — утечёт вся цепочка.

**6. Замыкание захватывает больше, чем нужно.** Все функции, созданные в одной области, разделяют её окружение, поэтому «маленькая» функция может удерживать «большой» объект просто потому, что он объявлен рядом.

```js
function outer() {
  const huge = new Array(1e7);
  const small = 1;
  return () => small;   // теоретически huge не нужен, но в некоторых случаях останется в контексте
}
```

Лечится вынесением тяжёлых данных в отдельную область или явным обнулением: `huge = null` после использования.

## Профилактика

- Всегда снимать слушатели, таймеры, подписки, `IntersectionObserver`, WebSocket-соединения (в React — в функции очистки `useEffect`).
- Использовать **WeakMap/WeakSet** для метаданных, привязанных к объектам: ключи удерживаются слабо и не мешают сборке мусора.
- Ограничивать размер кешей (LRU + TTL).
- Обнулять ссылки на большие объекты, когда они больше не нужны.
- Минимизировать область видимости — объявлять переменные рядом с использованием.
- Использовать `AbortController` для отмены fetch и группового снятия слушателей.

## Диагностика

DevTools → **Memory**: снять heap snapshot до и после действия, сравнить (Comparison view), искать растущие объекты и `Detached HTMLElement`. Вкладка **Performance** с галочкой Memory показывает пилообразный график: если после сборки мусора нижняя граница постоянно растёт — утечка. `performance.measureUserAgentSpecificMemory()` — программное измерение.

---

## Источники

- [Memory management — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)
- [Fix memory problems — Chrome DevTools](https://developer.chrome.com/docs/devtools/memory-problems/)
- [AbortController — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [WeakMap — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

---

## Связанные заметки

- [[Замыкания]]

