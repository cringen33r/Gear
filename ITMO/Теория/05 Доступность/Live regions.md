## Динамические сообщения: live regions

Скринридер не заметит изменение содержимого, если не пометить область как «живую»:

```html
<div role="status" aria-live="polite">Товар добавлен в корзину</div>
<div role="alert" aria-live="assertive">Ошибка: не удалось сохранить</div>
```

- `polite` — сообщить, когда пользователь закончит текущее действие (большинство случаев);
- `assertive` — прервать немедленно (только для критичных ошибок; злоупотребление раздражает);
- `aria-atomic="true"` — зачитать область целиком, а не только изменившийся фрагмент.

Контейнер live region должен присутствовать в DOM **заранее**: если добавить его вместе с текстом, изменение может не отследиться.

## Источники

- [ARIA live regions — MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [aria-live — WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/#aria-live)
- [role=alert — ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)

---

## Связанные заметки

- [[Доступность — принципы и WCAG]]
- [[Семантика HTML и ARIA]]
- [[Фокус и клавиатурная навигация]]
- [[Доступное имя элемента]]

