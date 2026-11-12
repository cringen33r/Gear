Не рекомендуется использовать ([WHATWG](ttps://wiki.whatwg.org/wiki/Why_not_conneg), [RFC 7231](https://httpwg.org/specs/rfc7231.html#content.negotiation))

> Proactive negotiation has serious disadvantages:
> - It is impossible for the server to accurately determine what might be "best" for any given user, since that would require complete knowledge of both the capabilities of the user agent and the intended use for the response (e.g., does the user want to view it on screen or print it on paper?);
> - Having the user agent describe its capabilities in every request can be both very inefficient (given that only a small percentage of responses have multiple representations) and a potential risk to the user's privacy;
> - It complicates the implementation of an origin server and the algorithms for generating responses to a request; and,
> - It limits the reusability of responses for shared caching.

**Причины отказа от HTTP Content Negotiation**

---

### 1. **Сжатие (Accept-Encoding)**

- Единственные практически используемые варианты — gzip и несжатое.
    
- Все браузеры поддерживают gzip, но каждый запрос содержит ~23 байта лишних заголовков.
    
- Эффективнее было бы сделать gzip обязательным в HTTP/1.1.
    

---

### 2. **Кодировка (Accept-Charset)**

- Поддержка UTF-8 — универсальное решение.
    
- Протокол мог бы просто использовать UTF-8 везде.
    
- Заголовок устарел: только Chrome его ещё отправляет.
    

---

### 3. **Язык (Accept-Language)**

- Разное качество переведённых версий сайтов — автоматический выбор неэффективен.
    
- Пользователь способен лучше выбрать нужный язык вручную.
    
- UI-приложения могут сами запросить язык через JavaScript.
    
- Конфигурация языка редко делается, может приводить к идентификации пользователя (проблемы приватности).
    

---

### 4. **Формат (Accept)**

- Автоматический выбор между форматами зависит от намерений пользователя (например, PDF vs DOC).
    
- Браузеры могут поддерживать формат, но не указывать об этом.
    
- Заголовки увеличивают размер запроса при редком применении.
    
- Исторически авторы сайтов не используют negotiation, а выбирают один формат.
    
- Возможен user-agent sniffing вместо заголовков.
    

---

### 5. **Проблемы с кешированием**

- Серверная логика выбора (через `Vary`) приводит к множеству кеш-ключей.
    
- Пример: видео с разными кодеками — каждый Accept-Codecs создаёт новый кеш-ключ.
    
- Альтернатива (как `<video><source>`): браузер сам выбирает URL, кеширование проще и эффективнее.
    

---

**Вывод**: Content Negotiation — неэффективно, редко нужно, ухудшает кеширование, перегружает запросы. Лучше явно указывать альтернативы и дать выбор клиенту.