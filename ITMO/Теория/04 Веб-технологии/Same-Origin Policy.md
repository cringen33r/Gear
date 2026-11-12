## Origin (источник)

**Origin** — тройка: **схема + хост + порт**. Совпадать должны все три.

| URL | Тот же origin, что `https://example.com/page`? |
|---|---|
| `https://example.com/other` | да (путь не важен) |
| `http://example.com/` | нет — другая схема |
| `https://api.example.com/` | нет — другой хост (поддомен считается другим) |
| `https://example.com:8443/` | нет — другой порт |

## Same-Origin Policy (SOP)

Фундаментальное правило безопасности браузера: **скрипт с одного origin по умолчанию не может читать данные другого origin**. Без него любой сайт мог бы, пока вы залогинены в банке, выполнить запрос к банку с вашими cookies и прочитать ответ.

SOP ограничивает:

- чтение ответов на межсайтовые HTTP-запросы (`fetch`, `XMLHttpRequest`);
- доступ к DOM другого окна/iframe;
- чтение содержимого canvas, «испорченного» (tainted) чужим изображением;
- доступ к `localStorage`, `sessionStorage`, IndexedDB, cookies другого origin.

Что SOP **не** блокирует — встраивание ресурсов:

- `<img src>`, `<script src>`, `<link rel="stylesheet">`, `<video>`, `<iframe>` — загрузка происходит, но чтение содержимого ограничено;
- **отправку** формы на другой origin (именно поэтому существует CSRF — запрос уходит, просто ответ не читается).

## Источники

- [Same-origin policy — MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [Origin — HTML Standard](https://html.spec.whatwg.org/multipage/browsers.html#origin)
- [Window.postMessage() — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

---

## Связанные заметки

- [[CORS]]

