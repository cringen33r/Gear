## Структура запроса

```
POST /api/users HTTP/1.1          ← стартовая строка: метод, путь, версия
Host: api.example.com             ← заголовки
Content-Type: application/json
Content-Length: 27
Authorization: Bearer eyJ...
                                  ← пустая строка
{"name":"Alice","age":30}         ← тело (опционально)
```

Части: **метод**, **target (путь + query)**, **версия протокола**, **заголовки**, **тело**.

## Структура ответа

```
HTTP/1.1 201 Created              ← статусная строка: версия, код, фраза
Content-Type: application/json    ← заголовки
Location: /api/users/42
Cache-Control: no-store

{"id":42,"name":"Alice"}          ← тело
```

## Важные заголовки

**Запроса:** `Host` (обязателен в HTTP/1.1), `Accept`, `Accept-Encoding`, `Accept-Language`, `Content-Type`, `Content-Length`, `Authorization`, `Cookie`, `Origin`, `Referer`, `User-Agent`, `If-None-Match`, `If-Modified-Since`, `Range`.

**Ответа:** `Content-Type`, `Content-Length`, `Content-Encoding`, `Cache-Control`, `ETag`, `Last-Modified`, `Location`, `Set-Cookie`, `Access-Control-Allow-Origin`, `Strict-Transport-Security`, `Content-Security-Policy`, `Vary`.

В HTTP/2 и HTTP/3 стартовая строка заменена псевдозаголовками (`:method`, `:path`, `:scheme`, `:authority`), а заголовки сжимаются (HPACK/QPACK) и передаются в бинарном виде по мультиплексированным потокам — но семантика та же.

## Источники

- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 9112 — HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112)
- [RFC 9113 — HTTP/2](https://www.rfc-editor.org/rfc/rfc9113)
- [HTTP messages — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages)

---

## Связанные заметки

- [[HTTP-методы и идемпотентность]]

