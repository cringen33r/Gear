## Правило первое: использовать нативную семантику

**Главное правило ARIA: «No ARIA is better than bad ARIA».** Нативный HTML-элемент бесплатно даёт всё необходимое: роль, состояние, фокусируемость, клавиатурное поведение, поддержку во всех вспомогательных технологиях, режим высокого контраста, работу без CSS.

```html
<!-- ❌ Нужно вручную воспроизводить всё поведение -->
<div class="btn" onclick="save()">Сохранить</div>

<!-- ✅ Работает из коробки -->
<button type="button" onclick="save()">Сохранить</button>
```

Что даёт `<button>` бесплатно: попадание в порядок табуляции, активация по `Enter` и `Space`, роль «кнопка» для скринридера, состояние `disabled`, отправка формы, видимый индикатор фокуса, работа с голосовым управлением («нажми Сохранить»).

Полезная замена самописных решений на нативные:

| Задача | Нативное решение |
|---|---|
| Кнопка | `<button>` |
| Ссылка/навигация | `<a href>` |
| Выпадающее меню выбора | `<select>` |
| Раскрывающийся блок | `<details><summary>` |
| Модальное окно | `<dialog>` + `showModal()` |
| Всплывающая панель | атрибут `popover` |
| Прогресс | `<progress>`, `<meter>` |
| Группа радиокнопок | `<fieldset><legend>` + `<input type="radio">` |
| Таблица данных | `<table>` с `<th scope>`, `<caption>` |

Ключевое различие, которое часто спрашивают: **`<a>` — для перехода куда-либо** (активируется `Enter`, поддерживает открытие в новой вкладке), **`<button>` — для выполнения действия** (активируется `Enter` и `Space`). `<a href="#" onclick>` — антипаттерн.

## Если элемент всё-таки кастомный

Когда нативного аналога нет (табы, комбобокс с автодополнением, слайдер сложной формы, дерево), нужно вручную обеспечить **четыре вещи**: роль, имя, состояние, клавиатурное поведение.

```html
<div role="button" tabindex="0" aria-pressed="false" id="toggle">
  Избранное
</div>
```

```js
const el = document.getElementById('toggle');

function activate() {
  const pressed = el.getAttribute('aria-pressed') === 'true';
  el.setAttribute('aria-pressed', String(!pressed));
}

el.addEventListener('click', activate);
el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();       // Space иначе прокрутит страницу
    activate();
  }
});
```

Уже на этом примере видно, сколько кода заменяет один `<button>`.

## ARIA: роли, состояния, свойства

**Роль** сообщает, что это за элемент: `button`, `tab`, `tablist`, `dialog`, `menu`, `alert`, `navigation`, `search`, `status`.

**Состояния и свойства** — динамические характеристики:

| Атрибут | Назначение |
|---|---|
| `aria-expanded` | раскрыт ли связанный блок (аккордеон, меню, комбобокс) |
| `aria-pressed` | нажата ли кнопка-переключатель |
| `aria-checked` | состояние чекбокса/переключателя (в том числе `mixed`) |
| `aria-selected` | выбран ли элемент (вкладка, опция) |
| `aria-disabled` | недоступен (в отличие от `disabled`, остаётся фокусируемым) |
| `aria-current` | текущий элемент (`page`, `step`, `date`) |
| `aria-controls` | id управляемого элемента |
| `aria-haspopup` | открывает всплывающий элемент |
| `aria-live` | область, об изменениях которой нужно сообщать |
| `aria-busy` | содержимое обновляется |
| `aria-describedby` | дополнительное описание (подсказка, ошибка) |

**Пять правил ARIA** (из спецификации):

1. Если есть подходящий нативный элемент — используйте его, а не ARIA.
2. Не меняйте нативную семантику без крайней необходимости (`<button role="heading">` — плохо).
3. Все интерактивные ARIA-элементы должны управляться с клавиатуры.
4. Не ставьте `role="presentation"` или `aria-hidden="true"` на фокусируемые элементы.
5. У каждого интерактивного элемента должно быть доступное имя.

**ARIA ничего не делает сама по себе** — она только меняет то, что сообщается вспомогательным технологиям. Поведение (обработку клавиш, изменение состояний) вы реализуете кодом.

## Пример: доступный аккордеон

```html
<h3>
  <button id="acc-btn" aria-expanded="false" aria-controls="acc-panel">
    Условия доставки
  </button>
</h3>
<div id="acc-panel" role="region" aria-labelledby="acc-btn" hidden>
  Доставка занимает 3–5 дней…
</div>
```

```js
btn.addEventListener('click', () => {
  const open = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!open));
  panel.hidden = open;
});
```

Клавиатура работает нативно, потому что использована настоящая кнопка; заголовок обеспечивает навигацию по структуре.

## Источники

- [WAI-ARIA 1.2 — W3C Recommendation](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [Rules of ARIA Use — Using ARIA](https://www.w3.org/TR/using-aria/#rules-of-aria-use)
- [ARIA in HTML — W3C](https://www.w3.org/TR/html-aria/)
- [ARIA — MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [<dialog> — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

---

## Связанные заметки

- [[Доступность — принципы и WCAG]]
- [[Фокус и клавиатурная навигация]]
- [[Доступное имя элемента]]
- [[Live regions]]

