## CORS

**Cross-Origin Resource Sharing** — стандартный механизм, которым **сервер разрешает** определённым origin читать свои ответы. Ключевая мысль: CORS не «обходит» защиту, а **ослабляет её по решению сервера**. Проверку выполняет браузер; запрос при этом сервером обычно уже обработан.

## Простые запросы (simple requests)

Запрос считается простым и отправляется **без предварительной проверки**, если:

- метод — `GET`, `HEAD` или `POST`;
- заголовки только из безопасного списка (`Accept`, `Accept-Language`, `Content-Language`, `Content-Type`, `Range`);
- `Content-Type` — только `text/plain`, `multipart/form-data` или `application/x-www-form-urlencoded`;
- нет обработчиков события upload у `XMLHttpRequest`, нет `ReadableStream` в теле.

Браузер добавляет заголовок `Origin`, сервер отвечает:

```
Access-Control-Allow-Origin: https://app.example.com
```

Если значение не совпадает с origin страницы (и не `*`), браузер **блокирует доступ к ответу** — при этом запрос уже выполнен на сервере.

## Предварительный запрос (preflight)

Для всех остальных случаев (метод `PUT`/`PATCH`/`DELETE`, `Content-Type: application/json`, кастомные заголовки вроде `Authorization` или `X-Request-Id`) браузер сначала шлёт `OPTIONS`:

```
OPTIONS /api/data HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type, authorization
```

Ответ сервера:

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400          ← кеш preflight на сутки
```

Только после успешного preflight отправляется основной запрос. `Access-Control-Max-Age` заметно снижает накладные расходы.

## Запросы с учётными данными

Чтобы браузер отправил cookies или заголовок `Authorization` из cookie-хранилища:

```js
fetch(url, { credentials: 'include' })   // 'same-origin' по умолчанию
```

Сервер обязан ответить:

```
Access-Control-Allow-Origin: https://app.example.com   ← точное значение, «*» запрещено
Access-Control-Allow-Credentials: true
```

Комбинация `Allow-Origin: *` + `Allow-Credentials: true` **недопустима** — браузер её отвергнет. Это защищает от того, чтобы «разрешить всем» и одновременно раздавать авторизованные данные.

## Чтение заголовков ответа

По умолчанию JS видит только безопасный набор заголовков. Чтобы открыть остальные:

```
Access-Control-Expose-Headers: X-Total-Count, Link, ETag
```

## Пример настройки на сервере

```js
// Express
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}));
```

Обязательно добавляйте `Vary: Origin`, если значение `Access-Control-Allow-Origin` зависит от запроса, — иначе промежуточные кеши отдадут чужой заголовок.

## «Способы обхода» — на самом деле легальные механизмы

Термин «обход» вводит в заблуждение: обойти SOP из браузера нельзя, можно лишь использовать другие механизмы.

**1. Правильная настройка CORS на сервере** — основной и правильный путь, когда сервер ваш.

**2. Прокси на своём сервере.** Браузер обращается к вашему origin, ваш backend делает запрос к внешнему API. SOP не действует между серверами. Так решают проблему с чужими API без CORS, а заодно скрывают секретные ключи.

**3. Dev-прокси в сборщике.** В разработке `vite.config.js` или webpack devServer проксируют `/api` на backend — фронтенд и API оказываются на одном origin.

**4. Обратный прокси в production.** nginx отдаёт статику и проксирует `/api` на бэкенд под тем же доменом — CORS не нужен вовсе. Это самая простая и надёжная схема.

**5. `postMessage`** — легальный способ обмена между окнами/iframe разных origin:

```js
// отправка
iframe.contentWindow.postMessage({ type: 'ping' }, 'https://other.example.com');

// приём — ОБЯЗАТЕЛЬНО проверять origin
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://trusted.example.com') return;
  handle(e.data);
});
```

**6. `document.domain`** — устаревший и небезопасный приём для поддоменов; браузеры его отключают.

**7. JSONP** — исторический хак на `<script src>` с колбэком. Работает только с GET, даёт удалённому серверу полный доступ к вашей странице (фактически XSS по доверию). **Не использовать.**

**8. CDN с CORS-заголовками, `crossorigin` атрибут** — для шрифтов, изображений в canvas и получения подробностей ошибок в `window.onerror` у внешних скриптов.

**9. Отключение веб-безопасности в браузере** (`--disable-web-security`) — только для локальной отладки, никогда для пользователей.

## Диагностика типичных ошибок

- *«No 'Access-Control-Allow-Origin' header is present»* — сервер не настроен, либо ошибка произошла до добавления заголовков (например, 500 без CORS-заголовков), либо не обработан `OPTIONS`.
- *«Response to preflight request doesn't pass»* — сервер отвечает на `OPTIONS` не 2xx, или не перечислил нужный метод/заголовок.
- *«Credentials flag is true, but Allow-Origin is '\*'»* — нужен конкретный origin.
- Запрос **виден в Network и выполнен**, но JS получает ошибку — нормальное поведение: блокируется чтение ответа, а не отправка. Отсюда следует, что CORS **не защищает сервер** — защищать должны аутентификация и авторизация.

## Смежные политики

- **CSP** (Content-Security-Policy) — ограничивает, откуда можно загружать ресурсы.
- **COOP / COEP / CORP** — изоляция origin, необходимая для `SharedArrayBuffer` и точных таймеров.
- **Subresource Integrity (SRI)** — проверка хеша внешнего скрипта.
- **Private Network Access** — ограничение запросов с публичных сайтов к локальной сети.

---

## Источники

- [CORS protocol — Fetch Standard](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [Cross-Origin Resource Sharing — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [Content Security Policy — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)

---

## Связанные заметки

- [[Same-Origin Policy]]

