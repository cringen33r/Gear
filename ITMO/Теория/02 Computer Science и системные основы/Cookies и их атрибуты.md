## Cookies

Механизм, придуманный для **состояния на стороне сервера**. Устанавливаются либо сервером через `Set-Cookie`, либо из JS.

```
Set-Cookie: sessionId=abc123; Max-Age=3600; Path=/; Domain=example.com;
            Secure; HttpOnly; SameSite=Lax
```

Атрибуты:

- **Expires / Max-Age** — срок жизни. Без них cookie сессионная (живёт до закрытия браузера).
- **Domain** — при указании cookie доступна и поддоменам. Без атрибута — только точному хосту.
- **Path** — ограничение по пути.
- **Secure** — передаётся только по HTTPS.
- **HttpOnly** — **недоступна из JavaScript**. Главная защита от кражи токена через XSS.
- **SameSite** — `Strict` (не отправляется при переходах с других сайтов), `Lax` (по умолчанию; отправляется при навигации верхнего уровня GET), `None` (отправляется всегда, требует `Secure`). Основная защита от CSRF.
- **Partitioned** (CHIPS) — отдельное хранилище cookie для каждого встраивающего сайта.

Ключевая особенность и главный недостаток: cookies **едут с каждым запросом** к домену, включая картинки и стили. Лишние килобайты в cookie напрямую замедляют весь сайт.

## Источники

- [RFC 6265 — HTTP State Management](https://www.rfc-editor.org/rfc/rfc6265)
- [draft-ietf-httpbis-rfc6265bis (SameSite)](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis)
- [Set-Cookie — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [SameSite cookies — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies#samesite)

---

## Связанные заметки

- [[localStorage и sessionStorage]]
- [[Выбор хранилища в браузере]]

