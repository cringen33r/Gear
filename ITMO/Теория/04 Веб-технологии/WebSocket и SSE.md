## Server-Sent Events подробно

```js
// Клиент
const es = new EventSource('/api/stream');

es.onmessage = (e) => console.log('data:', e.data);
es.addEventListener('price', (e) => updatePrice(JSON.parse(e.data)));
es.onerror = () => { /* браузер переподключится сам */ };
// es.close();
```

```js
// Сервер (Express)
app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',       // отключить буферизацию nginx
  });
  res.flushHeaders();

  const timer = setInterval(() => {
    res.write(`id: ${Date.now()}\n`);
    res.write(`event: price\n`);
    res.write(`data: ${JSON.stringify({ value: Math.random() })}\n\n`);
  }, 1000);

  req.on('close', () => clearInterval(timer));
});
```

Формат кадра — текстовые поля `data:`, `event:`, `id:`, `retry:`, разделённые пустой строкой. При обрыве браузер переподключается автоматически и присылает `Last-Event-ID`, что позволяет **возобновить поток с места разрыва** — встроенная возможность, которой у WebSocket нет.

## WebSocket подробно

```js
// Клиент
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', room: 'general' }));
ws.onmessage = (e) => handle(JSON.parse(e.data));
ws.onclose = (e) => scheduleReconnect(e.code);
ws.onerror = (e) => log(e);
```

Соединение начинается как HTTP-запрос с `Upgrade: websocket`, сервер отвечает `101 Switching Protocols`, после чего стороны обмениваются бинарными кадрами в обе стороны. Поддерживаются текст и `ArrayBuffer`/`Blob`.

## Сравнение

| Критерий | WebSocket | SSE |
|---|---|---|
| Направление | **двунаправленное** | сервер → клиент |
| Протокол | ws/wss (отдельный) | обычный HTTP(S) |
| Формат | текст и **бинарные** данные | только UTF-8 текст |
| Автопереподключение | **вручную** | **встроено** |
| Возобновление с места разрыва | вручную | **`Last-Event-ID`** |
| Прокси, файрволы, корпоративные сети | иногда блокируется | проходит как обычный HTTP |
| Сжатие | permessage-deflate | gzip как у HTTP |
| CORS | своя модель (проверять `Origin` на сервере) | стандартный CORS |
| Заголовки, cookies при подключении | cookies да, кастомные заголовки — нет | стандартные HTTP-заголовки |
| Лимит соединений | высокий | **6 на домен в HTTP/1.1**; в HTTP/2 — мультиплексирование |
| Сложность инфраструктуры | выше (sticky sessions, отдельное масштабирование) | ниже (обычный HTTP-стек) |
| Поддержка в браузерах | повсеместная | повсеместная (кроме старого IE) |
| Задержка | минимальная | минимальная |
| Накладные расходы на сообщение | 2–14 байт | несколько байт текста |

## Когда выбирать SSE

- Поток идёт **только от сервера**: лента новостей, котировки, спортивный счёт, прогресс длительной операции, уведомления, логи и метрики в реальном времени.
- Стриминг ответов LLM (частый современный кейс).
- Нужны простота и минимум инфраструктуры: обычный HTTP-эндпоинт, стандартное логирование, аутентификация и кеш-прокси работают как обычно.
- Важна устойчивость к нестабильной сети — переподключение и `Last-Event-ID` из коробки.
- Клиентские действия можно отправлять обычными POST-запросами — это часто вполне достаточно и проще, чем полноценный дуплекс.

## Когда выбирать WebSocket

- Нужен **частый двусторонний обмен с низкой задержкой**: чаты, совместное редактирование (Google Docs-подобное), многопользовательские игры, торговые терминалы с отправкой заявок, WebRTC-сигналинг.
- Нужны **бинарные данные** (аудио, видео-метаданные, protobuf, MessagePack).
- Клиент часто отправляет сообщения, и накладные расходы отдельных HTTP-запросов неприемлемы.
- Требуется собственный прикладной протокол поверх канала.

## Источники

- [RFC 6455 — The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455)
- [Server-sent events — HTML Standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource — MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [WebSocket — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [The WebSocket Handbook / Cross-Site WebSocket Hijacking — PortSwigger](https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking)

---

## Связанные заметки

- [[Обмен данными в реальном времени]]

