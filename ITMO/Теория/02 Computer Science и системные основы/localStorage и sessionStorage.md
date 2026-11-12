## localStorage

Простое синхронное хранилище «строка → строка», привязанное к **origin**. Данные сохраняются между сессиями и перезапусками браузера, разделяются между всеми вкладками одного origin.

```js
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');          // 'dark'
localStorage.removeItem('theme');
localStorage.clear();

// объекты нужно сериализовать вручную
localStorage.setItem('user', JSON.stringify({ id: 1 }));
const user = JSON.parse(localStorage.getItem('user') ?? 'null');
```

Событие `storage` срабатывает **в других вкладках** того же origin — удобно для синхронизации темы или разлогина во всех вкладках.

Недостатки: **синхронный API блокирует главный поток**, нет структурированного поиска, ограничение по объёму, доступен любому JS на странице (уязвим к XSS), в приватном режиме или при отключённых cookies обращение может бросать исключение.

## sessionStorage

То же API, но область — **вкладка**. Каждая вкладка имеет собственную копию; открытие того же сайта в новой вкладке даёт пустое хранилище. Данные переживают перезагрузку страницы и навигацию в пределах вкладки, но не её закрытие. Дублирование вкладки копирует содержимое.

Применение: состояние многошаговой формы, позиция скролла, данные, специфичные для конкретного рабочего процесса в конкретной вкладке.

## Источники

- [Web storage — HTML Standard](https://html.spec.whatwg.org/multipage/webstorage.html)
- [Window.localStorage — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Window.sessionStorage — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [storage event — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)

---

## Связанные заметки

- [[Cookies и их атрибуты]]
- [[Выбор хранилища в браузере]]

