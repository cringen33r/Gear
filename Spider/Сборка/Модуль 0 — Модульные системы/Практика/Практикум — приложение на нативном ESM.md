Цель: своими руками увидеть, что именно делает за вас сборщик. Собрать работающее приложение **без единого инструмента сборки** и упереться в ограничения, ради обхода которых бандлеры и существуют.

Время: 1–2 часа. Опирается на [[Модули в браузере — script type=module]], [[Import maps]], [[Предел нативного ESM в браузере]].

# Шаг 1. Каркас

```
demo/
├── index.html
└── src/
    ├── main.js
    ├── ui/render.js
    ├── store/state.js
    └── utils/format.js
```

```html
<!-- index.html -->
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Native ESM</title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

```js
// src/utils/format.js
export const formatDate = (d) => d.toISOString().slice(0, 10);
export const formatMoney = (n) => n.toFixed(2) + ' ₽';
```

```js
// src/store/state.js
import { formatDate } from '../utils/format.js';
export const state = { items: [], updated: formatDate(new Date()) };
export function addItem(item) { state.items.push(item); }
```

```js
// src/ui/render.js
import { state } from '../store/state.js';
import { formatMoney } from '../utils/format.js';
export function render(root) {
  root.innerHTML = state.items.map(i => `<li>${i.name} — ${formatMoney(i.price)}</li>`).join('');
}
```

```js
// src/main.js
import { addItem } from './store/state.js';
import { render } from './ui/render.js';
addItem({ name: 'Товар', price: 100 });
render(document.querySelector('#app'));
```

Запуск — **обязательно через HTTP-сервер**, `file://` не сработает (origin `null`, CORS):

```bash
npx serve .
# или python3 -m http.server
```

## Что проверить

1. Откройте Network, отфильтруйте по JS. Посмотрите **порядок и вложенность** запросов: браузер узнаёт о `format.js` только после разбора `state.js`. Это [[Предел нативного ESM в браузере|водопад]] вживую.
2. Во вкладке Sources найдите модули — каждый отдельным файлом.
3. В консоли наберите `state` — `undefined`. Модульная область видимости.

# Шаг 2. Сломать намеренно

Каждая поломка закрепляет одно правило.

**Убрать расширение:**
```js
import { formatDate } from '../utils/format';   // 404
```
Браузер не дописывает `.js` — этому приучили сборщики. См. [[Спецификаторы модулей]].

**Импорт директории:**
```js
import { state } from '../store';                // 404
```
Никакого `index.js` по умолчанию.

**Bare-спецификатор:**
```js
import { debounce } from 'lodash-es';
// Failed to resolve module specifier "lodash-es"
```

**Опечатка в имени экспорта:**
```js
import { formatDatee } from '../utils/format.js';
// SyntaxError: The requested module does not provide an export named 'formatDatee'
```
Обратите внимание: это ошибка **связывания**, до выполнения. Ни одна строка приложения не выполнилась. Механика — [[Фазы загрузки ESM]].

# Шаг 3. Import map

Добавьте карту **до** тега модуля:

```html
<script type="importmap">
{
  "imports": {
    "lodash-es": "https://esm.sh/lodash-es@4",
    "#utils/": "/src/utils/"
  }
}
</script>
<script type="module" src="/src/main.js"></script>
```

```js
import { debounce } from 'lodash-es';
import { formatMoney } from '#utils/format.js';
```

Работает. В Network видно обращение к CDN.

## Что проверить

- Поставьте карту **после** `<script type="module">` — сломается. Карта должна быть распарсена раньше первого резолва.
- Посмотрите, сколько запросов породил `lodash-es` с CDN. Здесь становится очевидна разница между «резолвинг решён» и «загрузка оптимизирована».

Подробности — [[Import maps]].

# Шаг 4. Живые связывания

```js
// src/store/state.js
export let counter = 0;
export function increment() { counter += 1; }
```

```js
// src/main.js
import { counter, increment } from './store/state.js';
console.log(counter);   // 0
increment();
console.log(counter);   // 1  ← значение обновилось
// counter = 5;         // TypeError — раскомментируйте и убедитесь
```

Затем перепишите `state.js` в стиле CommonJS-семантики (экспорт копии значения) и убедитесь, что связь пропадает. См. [[Live bindings]].

# Шаг 5. Реестр модулей

```js
// src/probe.js
console.log('probe выполнен', Math.random());
export const id = Math.random();
```

Импортируйте его из трёх разных модулей. В консоли — **одно** сообщение.

Теперь добавьте четвёртый импорт с query:

```js
import './probe.js?v=2';
```

Второе сообщение появилось: другой URL — другой ключ реестра — другой экземпляр. Это ровно механика HMR и корень [[Dual package hazard]]. См. [[Реестр модулей и singleton-семантика]].

# Шаг 6. Динамический импорт

```js
document.querySelector('#app').addEventListener('click', async () => {
  const { heavyReport } = await import('./features/report.js');
  heavyReport();
});
```

В Network видно: `report.js` не загружается при старте, запрос уходит **по клику**. Это code splitting без сборщика — сборщик добавит к этому чанки, хеши и предзагрузку. См. [[Динамический import()]].

Проверьте кэширование: кликните дважды, второй запрос не уйдёт.

# Шаг 7. Циклическая зависимость

```js
// src/a.js
import { bValue } from './b.js';
export const aValue = 'A';
console.log('a видит:', bValue);

// src/b.js
import { aValue } from './a.js';
export const bValue = 'B';
console.log('b видит:', aValue);   // ReferenceError
```

Получите `Cannot access 'aValue' before initialization`. Затем перепишите через функции и убедитесь, что цикл становится безобидным. См. [[Циклические зависимости]].

# Выводы, которые нужно записать

После практикума сформулируйте своими словами:

- [ ] Сколько последовательных запросов породил ваш граф и почему их нельзя распараллелить.
- [ ] Какие «удобства» ваших обычных импортов на самом деле дал сборщик, а не язык.
- [ ] Что именно решает import map и чего он не решает.
- [ ] В какой момент проект стал бы неудобным без сборки.

Ответ на последний пункт — это и есть личная граница «когда нужен бандлер». Дальше — [[Предел нативного ESM в браузере]] и модуль 1 плана.

# Связанные заметки

- [[Модули в браузере — script type=module]]
- [[Import maps]]
- [[Предел нативного ESM в браузере]]
- [[Фазы загрузки ESM]]
- [[00 MOC — Модульные системы и загрузка кода]]
