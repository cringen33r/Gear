# @angular/aria — технический reference (целевая версия v21)

> **Версия, по которой составлен документ:** `@angular/aria@21.2.14` (dist-tag `v21-lts`). Раздел [«Миграция на v22»](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#14-%D0%BC%D0%B8%D0%B3%D1%80%D0%B0%D1%86%D0%B8%D1%8F-%D0%BD%D0%B0-v22) сверен с `22.0.0`, `22.1.0` и `22.2.2` (текущий `latest`).
> 
> **Источник:** все сигнатуры, значения по умолчанию, host-биндинги и клавиатурные карты сняты непосредственно из опубликованного npm-пакета (`types/*.d.ts` и `fesm2022/*.mjs`), а не из пересказа документации. Там, где документация (JSDoc / angular.dev) расходится с кодом, это отмечено отдельно — верьте коду.
> 
> **Статус API:** все директивы помечены `@developerPreview 21.0`. Между мажорами API ломается (см. раздел 14). Entry point `@angular/aria/private` — внутренний, без гарантий совместимости даже между минорами.

---

## Содержание

1. [Установка и entry points](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#1-%D1%83%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0-%D0%B8-entry-points)
2. [Архитектура: три слоя](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#2-%D0%B0%D1%80%D1%85%D0%B8%D1%82%D0%B5%D0%BA%D1%82%D1%83%D1%80%D0%B0-%D1%82%D1%80%D0%B8-%D1%81%D0%BB%D0%BE%D1%8F)
3. [Общие концепции (действуют во всех паттернах)](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#3-%D0%BE%D0%B1%D1%89%D0%B8%D0%B5-%D0%BA%D0%BE%D0%BD%D1%86%D0%B5%D0%BF%D1%86%D0%B8%D0%B8)
4. [Карта зависимостей директив](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#4-%D0%BA%D0%B0%D1%80%D1%82%D0%B0-%D0%B7%D0%B0%D0%B2%D0%B8%D1%81%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D0%B5%D0%B9-%D0%B4%D0%B8%D1%80%D0%B5%D0%BA%D1%82%D0%B8%D0%B2)
5. [Accordion](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#5-accordion)
6. [Tabs](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#6-tabs)
7. [Listbox](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#7-listbox)
8. [Toolbar](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#8-toolbar)
9. [Tree](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#9-tree)
10. [Menu / MenuBar](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#10-menu--menubar)
11. [Grid](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#11-grid)
12. [Combobox (+ Autocomplete, Select, Multiselect)](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#12-combobox)
13. [Слой `@angular/aria/private`: паттерны и поведения](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#13-%D1%81%D0%BB%D0%BE%D0%B9-angularariaprivate)
14. [Миграция на v22](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#14-%D0%BC%D0%B8%D0%B3%D1%80%D0%B0%D1%86%D0%B8%D1%8F-%D0%BD%D0%B0-v22)
15. [Известные ловушки v21 (сводка)](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#15-%D0%B8%D0%B7%D0%B2%D0%B5%D1%81%D1%82%D0%BD%D1%8B%D0%B5-%D0%BB%D0%BE%D0%B2%D1%83%D1%88%D0%BA%D0%B8-v21)
16. [Чек-лист рабочего ARIA-компонента](https://claude.ai/chat/f2d4ea06-9970-4a3f-b4ec-6ddc3c9f1c1a#16-%D1%87%D0%B5%D0%BA-%D0%BB%D0%B8%D1%81%D1%82-%D1%80%D0%B0%D0%B1%D0%BE%D1%87%D0%B5%D0%B3%D0%BE-aria-%D0%BA%D0%BE%D0%BC%D0%BF%D0%BE%D0%BD%D0%B5%D0%BD%D1%82%D0%B0)

---

## 1. Установка и entry points

```bash
npm i @angular/aria@21 @angular/cdk@21
```

`peerDependencies` (21.2.14): `@angular/cdk: 21.2.14` (точное совпадение версии), `@angular/core: ^21.0.0 || ^22.0.0`. CDK нужен как минимум для `Directionality` (RTL) и `_IdGenerator`; для попапов — `@angular/cdk/overlay`.

|Entry point|Экспорт|
|---|---|
|`@angular/aria`|только `VERSION`|
|`@angular/aria/accordion`|`AccordionGroup`, `AccordionTrigger`, `AccordionPanel`, `AccordionContent`|
|`@angular/aria/tabs`|`Tabs`, `TabList`, `Tab`, `TabPanel`, `TabContent`|
|`@angular/aria/listbox`|`Listbox`, `Option`|
|`@angular/aria/toolbar`|`Toolbar`, `ToolbarWidget`, `ToolbarWidgetGroup`|
|`@angular/aria/tree`|`Tree`, `TreeItem`, `TreeItemGroup`|
|`@angular/aria/menu`|`Menu`, `MenuBar`, `MenuItem`, `MenuTrigger`, `MenuContent`|
|`@angular/aria/grid`|`Grid`, `GridRow`, `GridCell`, `GridCellWidget`|
|`@angular/aria/combobox`|`Combobox`, `ComboboxInput`, `ComboboxPopup`, `ComboboxPopupContainer`, `ComboboxDialog`|
|`@angular/aria/private`|UI-паттерны (`*Pattern`), их `*Inputs`, `DeferredContent(Aware)`, хелперы сигналов — см. раздел 13|

Все директивы — standalone, импортируются напрямую в `imports: [...]` компонента. Символы с префиксом `ɵɵ` (`ɵɵDeferredContent`, `ɵɵComboboxPopup` и т.п.) — служебные реэкспорты, не используйте их.

---

## 2. Архитектура: три слоя

```
┌───────────────────────────────────────────────────────────────┐
│ 1. Директивы (@angular/aria/<pattern>)                         │
│    Angular-обвязка: input()/model()/output(), DI-связи,        │
│    host-биндинги (role, aria-*, tabindex), host-listeners      │
│    (keydown, pointerdown, focusin…), afterRenderEffect         │
├───────────────────────────────────────────────────────────────┤
│ 2. UI-паттерны (@angular/aria/private)                         │
│    ListboxPattern, TreePattern, MenuPattern, GridPattern…      │
│    Фреймворк-независимые классы на сигналах. Держат состояние,  │
│    вычисляют aria-атрибуты, содержат КЛАВИАТУРНЫЕ КАРТЫ        │
│    (KeyboardEventManager) и обработчики pointer/focus.         │
├───────────────────────────────────────────────────────────────┤
│ 3. Поведения (behaviors) — не экспортируются                   │
│    List = ListFocus + ListNavigation + ListSelection +         │
│           ListTypeahead; ListExpansion; Tree; Grid (GridData,  │
│           GridFocus, GridNavigation, GridSelection)            │
└───────────────────────────────────────────────────────────────┘
```

Ключевые свойства архитектуры:

- **Всё на сигналах.** Паттерны принимают входы как `SignalLike<T> = () => T` и `WritableSignalLike<T>` (с `set/update/asReadonly`). Директива передаёт в паттерн свои `input()`/`model()` (часто через `{...this, ...}`).
- **События обрабатывает контейнер.** `keydown`/`pointerdown`/`focusin` висят на корневой директиве (`ngListbox`, `ngTree`, `ngTabList`, `ngAccordionGroup`, `ngToolbar`, `ngGrid`, `ngMenu`, `ngMenuBar`, `ngCombobox`). Дочерние элементы (`ngOption`, `ngTab`…) только регистрируются и получают атрибуты. Исключения: `ngMenuTrigger` и `ngMenuItem` (focusin), `ngCombobox` целиком на обёртке.
- **Порядок элементов = порядок в DOM.** Для `contentChildren(..., {descendants: true})` — порядок запроса; `Tabs` и `Tree` сортируют зарегистрированные директивы по позиции в DOM (`sortDirectives`).
- **Директивы не рисуют ничего.** Ни стилей, ни скрытия, ни позиционирования. Видимость панелей/попапов — ваша CSS-задача (опирайтесь на `aria-expanded`, `inert`, `data-*`), позиционирование — CDK Overlay.

---

## 3. Общие концепции

### 3.1. Режим фокуса `focusMode`

|Значение|Как работает|Где доступно|
|---|---|---|
|`'roving'` (по умолчанию)|Реальный DOM-фокус переезжает на активный элемент; у активного `tabindex="0"`, у остальных `-1`; у контейнера `tabindex="-1"`.|Listbox, Tree, TabList, Grid. Accordion, Toolbar и Menu — **только** roving (зашито).|
|`'activedescendant'`|Фокус остаётся на контейнере (`tabindex="0"`), активный элемент указывается через `aria-activedescendant` = `id` элемента. У элементов `tabindex="-1"`.|Listbox, Tree, TabList, Grid. Listbox/Tree внутри Combobox принудительно переводятся в этот режим, фокус остаётся на `<input>`.|

Следствия для кастомных компонентов:

- В `roving` элемент списка должен быть фокусируемым (`<div>` получит `tabindex` от директивы — этого достаточно).
- В `activedescendant` **визуальный фокус-индикатор нужно рисовать самим** по `[data-active="true"]` (см. 3.8).
- `id` у элементов генерируются автоматически (`ng-option-…`, `ng-tree-item-…`, `ng-tab-…` и т.д., через `_IdGenerator`). Можно переопределить input'ом `id`.

### 3.2. Режим выбора `selectionMode`

|Значение|Поведение|
|---|---|
|`'follow'`|Выбор следует за фокусом: стрелки/Home/End/typeahead сразу выбирают элемент (single) или «выбрать только этот» (multi, с Ctrl/⌘ — перемещение без выбора).|
|`'explicit'`|Стрелки только перемещают фокус; выбор — Space/Enter/клик.|

Значения по умолчанию разные: **Listbox `follow`, TabList `follow`, Tree `explicit`, Grid `follow`** (но у Grid выбор вообще выключен, пока `enableSelection=false`). Toolbar и Menu — `explicit` зашито.

### 3.3. `disabled` vs `softDisabled`

- `disabled` на контейнере выключает весь виджет (`aria-disabled="true"`, клавиатура и указатель игнорируются).
- `disabled` на элементе — элемент неактивен (`aria-disabled="true"`).
- `softDisabled` (на контейнере; **по умолчанию `true` везде**): отключённые элементы **остаются фокусируемыми** при навигации (рекомендация WAI-ARIA для меню/списков, чтобы пользователь скринридера узнал о существовании опции). При `false` отключённые элементы пропускаются при навигации.
- «Жёсткое» отключение (атрибут `disabled` на хосте) ставят только: `AccordionTrigger` (если группа `softDisabled=false`), `ToolbarWidget` (+`inert`), `MenuTrigger`/`MenuBar` (если их собственный `softDisabled=false`).

### 3.4. `orientation`, RTL и `wrap`

Клавиши навигации вычисляются из `orientation` и `Directionality` (CDK `Dir`/`dir="rtl"`):

|orientation|«предыдущий»|«следующий»|
|---|---|---|
|`vertical`|ArrowUp|ArrowDown|
|`horizontal`, LTR|ArrowLeft|ArrowRight|
|`horizontal`, RTL|ArrowRight|ArrowLeft|

`wrap=true` — с последнего элемента переход на первый и наоборот. При выделении диапазона (Shift+стрелки) wrap временно отключается.

### 3.5. Typeahead

Listbox, Tree, Menu, MenuBar: печатаемый символ (`/^.$/`, без модификаторов) запускает поиск по `searchTerm` элемента (`label` input или `textContent`). Буфер сбрасывается через `typeaheadDelay` мс (**500** по умолчанию; JSDoc у Tree ошибочно пишет «секунды» — в коде миллисекунды). Пока идёт набор, **пробел трактуется как часть запроса**, а не как выбор (`dynamicSpaceKey`).

### 3.6. Начальное состояние и «первый фокус»

Контейнеры с флагом `_hasFocused`/`hasBeenFocused` до первого фокуса в каждом `afterRenderEffect` вызывают `setDefaultState()`: активным становится **первый выбранный фокусируемый** элемент, иначе первый фокусируемый. Именно поэтому Tab в виджет попадает на выбранный элемент. После первого фокуса активный элемент больше автоматически не сбрасывается (кроме случая, когда он удалён из DOM — тогда фокус снимается).

### 3.7. Обработка клавиатуры: `KeyboardEventManager`

Каждый паттерн строит карту клавиш через внутренний `KeyboardEventManager`:

- По умолчанию для каждой обработанной клавиши: `preventDefault()` **и** `stopPropagation()`, `ignoreRepeat: true` (автоповтор при удержании игнорируется; для стрелок явно включён `ignoreRepeat: false`).
- `on(key, handler)` без модификаторов срабатывает **только если модификаторы не нажаты**. Ctrl+ArrowDown не обработается, если не зарегистрирован отдельно. `Modifier.Any` — любые модификаторы.
- Клавиши, не попавшие в карту, **не трогаются** — всплывают дальше и сохраняют нативное поведение (Tab выходит из виджета, т.к. Tab нигде не зарегистрирован).

Практические следствия:

- Обработанные клавиши **не всплывают** к предкам. Если вам нужно перехватить, например, Enter над `ngListbox`, вешайте обработчик на дочерний элемент (он сработает раньше, на фазе всплытия) или используйте capture-фазу.
- `preventDefault` на Enter/Space у `<button>` подавляет нативный `click` от клавиатуры (подробности — в Toolbar, раздел 8.6).

### 3.8. Хуки для стилизации

Директивы выставляют атрибуты, на которые стоит опираться в CSS:

|Атрибут|Где|Значение|
|---|---|---|
|`data-active`|Option, Tab, TreeItem, MenuItem, AccordionTrigger, ToolbarWidget, GridCell, GridCellWidget|`true` у активного (сфокусированного/активного-потомка) элемента|
|`aria-selected`|Option, Tab, TreeItem, GridCell|выбран|
|`aria-expanded`|AccordionTrigger, TreeItem, MenuItem (с подменю), MenuTrigger, ComboboxInput|раскрыт|
|`aria-disabled`|почти все|отключён|
|`inert`|AccordionPanel, TabPanel (скрытые), ToolbarWidget (hard-disabled)|скрыт для AT и фокуса — **визуально скрывать вам**|
|`data-visible`|Menu|меню видимо|
|`data-expanded`|Combobox (обёртка)|попап открыт|
|`data-open`|ComboboxDialog|диалог открыт|
|`data-anchor`|GridCell|якорь выделения диапазона|
|`data-active-control`|GridCellWidget|`"widget"`, если виджет активирован, иначе `"cell"`|

Пример минимального CSS:

```css
[role="tabpanel"][inert], [role="region"][inert] { display: none; }
[role="option"][data-active="true"] { outline: 2px solid var(--focus-ring); }
[ngMenu]:not([data-visible="true"]) { display: none; }
```

### 3.9. Ленивый контент: `DeferredContent` / `DeferredContentAware`

Пара внутренних директив, используемая как `hostDirectives`:

- `DeferredContentAware` (на панели/меню/комбобоксе/элементе дерева) хранит `contentVisible: WritableSignal<boolean>` и **input/model `preserveContent: boolean`** (по умолчанию `false`).
- `DeferredContent` (на `ng-template`: `ngAccordionContent`, `ngTabContent`, `ngMenuContent`, `ngTreeItemGroup`, `ngComboboxPopupContainer`) создаёт view, когда `contentVisible()` стал `true`.
- `preserveContent=false`: контент уничтожается при скрытии. `true`: однажды созданный контент сохраняется.

`preserveContent` пробрасывается как input на: `ngAccordionPanel`, `ngTabPanel`, `ngMenu`, `ngCombobox`.

### 3.10. Двустороннее связывание: `values`, а не `value`

В v21 модели выбора называются во множественном числе: `[(values)]` у `ngListbox`, `ngTree`, `ngToolbar`, `ngMenuBar`; тип — массив `V[]` даже при одиночном выборе. **Примеры в JSDoc v21 используют `[(value)]` — это ошибка документации**, такой input не существует, шаблон не скомпилируется (в v22 переименовано обратно в `value`, см. раздел 14).

---

## 4. Карта зависимостей директив

«Требует» = `inject()` без `optional` → при нарушении структуры будет `NullInjectorError` во время создания. «Опционально» = работает и без предка, меняет поведение при его наличии.

|Директива|Требует (DI, предок)|Связь по ссылке (input)|Регистрирует детей через|Опционально|
|---|---|---|---|---|
|`ngAccordionGroup`|—|—|`contentChildren(AccordionTrigger, descendants)`|—|
|`ngAccordionTrigger`|`ngAccordionGroup` (токен `ACCORDION_GROUP`)|`[panel]` → `ngAccordionPanel` (**required**)|—|—|
|`ngAccordionPanel`|—|(на него ссылается триггер)|—|—|
|`ngAccordionContent` (`ng-template`)|`ngAccordionPanel` (через `DeferredContentAware`)|—|—|—|
|`ngTabs`|—|—|регистрация `TabList`/`TabPanel`|—|
|`ngTabList`|`ngTabs` (`TABS`)|—|регистрация `Tab`|—|
|`ngTab`|`ngTabs` **и** `ngTabList`|`value` ↔ `ngTabPanel[value]` (строка, **required**)|—|—|
|`ngTabPanel`|`ngTabs`|`value` (**required**)|—|—|
|`ngTabContent` (`ng-template`)|`ngTabPanel`|—|—|—|
|`ngListbox`|—|—|`contentChildren(Option, descendants)`|`ComboboxPopup` (hostDirective) → `ngCombobox`|
|`ngOption`|`ngListbox` (`LISTBOX`)|—|—|—|
|`ngToolbar`|—|—|регистрация `ToolbarWidget`|—|
|`ngToolbarWidget`|`ngToolbar`|—|—|`ngToolbarWidgetGroup`|
|`ngToolbarWidgetGroup`|(`ngToolbar` — optional inject, но без него не работает)|—|`contentChildren(ToolbarWidget)`|—|
|`ngTree`|—|—|регистрация `TreeItem`|`ComboboxPopup` (hostDirective) → `ngCombobox`|
|`ngTreeItem`|—|`[parent]` → `ngTree` или `ngTreeItemGroup` (**required**)|—|—|
|`ngTreeItemGroup` (`ng-template`)|—|`[ownedBy]` → `ngTreeItem` (**required**)|регистрация `TreeItem`|—|
|`ngMenuBar`|—|—|`contentChildren(MenuItem, descendants)`|—|
|`ngMenu`|—|—|`contentChildren(MenuItem, descendants)` (фильтр: прямые дети)|родитель задаётся триггером/пунктом|
|`ngMenuItem`|—|`[submenu]` → `ngMenu`|—|`ngMenu`/`ngMenuBar` (`MENU_COMPONENT`, optional)|
|`ngMenuTrigger`|—|`[menu]` → `ngMenu`|—|—|
|`ngMenuContent` (`ng-template`)|`ngMenu`|—|—|—|
|`ngGrid`|—|—|`contentChildren(GRID_ROW, descendants)`|—|
|`ngGridRow`|`ngGrid`|—|`contentChildren(GRID_CELL, descendants)`|—|
|`ngGridCell`|`ngGridRow` (`GRID_ROW`)|—|`contentChildren(GridCellWidget, descendants)`|—|
|`ngGridCellWidget`|`ngGridCell` (`GRID_CELL`)|—|—|—|
|`ngCombobox`|—|—|`contentChild(ComboboxPopup)`|—|
|`ngComboboxInput` (`input`)|`ngCombobox`|—|—|—|
|`ngComboboxPopupContainer` (`ng-template`)|`ngCombobox` (через `DeferredContentAware`)|—|—|—|
|`ngComboboxDialog` (`dialog`)|`ngCombobox`|—|—|—|

**Связи через ссылку на шаблонную переменную** (не DI) — частый источник ошибок при обёртывании в свои компоненты:

```html
<button ngAccordionTrigger [panel]="p">…</button>   <div ngAccordionPanel #p="ngAccordionPanel">
<li ngTreeItem [parent]="tree" #item="ngTreeItem">     <ng-template ngTreeItemGroup [ownedBy]="item" #g="ngTreeItemGroup">
<button ngMenuTrigger [menu]="m">                      <div ngMenu #m="ngMenu">
<div ngMenuItem [submenu]="sub">                       <div ngMenu #sub="ngMenu">
```

`exportAs` у каждой директивы совпадает с селектором без скобок (`ngListbox`, `ngTreeItem`, `ngMenu`, …).

---

## 5. Accordion

Entry: `@angular/aria/accordion`. Паттерн WAI-ARIA: Accordion.

### 5.1. Директивы

#### `ngAccordionGroup` — `[ngAccordionGroup]`

|Input|Тип|По умолчанию|Описание|
|---|---|---|---|
|`disabled`|`boolean`|`false`|Отключает все триггеры|
|`multiExpandable`|`boolean`|**`true`**|Можно раскрыть несколько панелей. Для «классического» аккордеона ставьте `false`|
|`softDisabled`|`boolean`|`true`|Отключённые триггеры фокусируемы|
|`wrap`|`boolean`|**`false`**|Зацикливание навигации|

Публичное: `element`, `textDirection`, `expandAll()` (только при `multiExpandable`), `collapseAll()`. Host: listeners `keydown`, `pointerdown`, `focusin`. Роли не ставит. **Ориентация навигации зашита как vertical** (в директиве нет input `orientation`).

#### `ngAccordionTrigger` — `[ngAccordionTrigger]`

|Input / model|Тип|По умолчанию|Описание|
|---|---|---|---|
|`panel`|`AccordionPanel`|— **required**|Ссылка на панель|
|`id`|`string`|авто `ng-accordion-trigger-*`||
|`disabled`|`boolean`|`false`||
|`expanded`|`model<boolean>`|`false`|`[(expanded)]`, output `expandedChange`|

Публичное: `element`, `panelId`, `active`, `expand()`, `collapse()`, `toggle()`. Host: `role="button"`, `id`, `aria-expanded`, `aria-controls` (= id панели), `aria-disabled`, `disabled` (hard), `tabindex`, `data-active`.

#### `ngAccordionPanel` — `[ngAccordionPanel]`

|Input|Тип|По умолчанию|
|---|---|---|
|`id`|`string`|авто `ng-accordion-panel-*`|
|`preserveContent`|`boolean` (model)|`false`|

Публичное: `visible: Signal<boolean>`, `expand()`, `collapse()`, `toggle()`. Host: `role="region"`, `id`, `aria-labelledby` (= id триггера), `inert` когда скрыта.

#### `ngAccordionContent` — `ng-template[ngAccordionContent]`

Без входов. Ленивый рендер содержимого панели.

### 5.2. Клавиатура (фокус на триггере)

|Клавиша|Действие|
|---|---|
|ArrowDown / ArrowUp|Следующий / предыдущий триггер (с учётом `wrap`)|
|Home / End|Первый / последний триггер|
|Enter / Space|Раскрыть/свернуть активную панель|
|Tab|Нативный: выход из группы / в содержимое панели|

Указатель: `pointerdown` по триггеру → сделать активным + toggle. Все триггеры имеют `tabindex` по roving-схеме (в Tab-последовательности только активный).

### 5.3. Минимальный скелет

```html
<div ngAccordionGroup [multiExpandable]="false">
  <h3><button ngAccordionTrigger [panel]="p1">Раздел 1</button></h3>
  <div ngAccordionPanel #p1="ngAccordionPanel">
    <ng-template ngAccordionContent>Содержимое 1</ng-template>
  </div>

  <h3><button ngAccordionTrigger [panel]="p2" [(expanded)]="open2">Раздел 2</button></h3>
  <div ngAccordionPanel #p2="ngAccordionPanel">
    <ng-template ngAccordionContent>Содержимое 2</ng-template>
  </div>
</div>
```

Заголовок-обёртка (`<h3>`) — ваша ответственность (паттерн APG требует `heading` вокруг кнопки).

---

## 6. Tabs

Entry: `@angular/aria/tabs`. Паттерн WAI-ARIA: Tabs.

### 6.1. Директивы

#### `ngTabs` — `[ngTabs]`

Без входов. Координатор: связывает `TabList` и `TabPanel`'ы по `value`.

#### `ngTabList` — `[ngTabList]`

|Input / model|Тип|По умолчанию|
|---|---|---|
|`orientation`|`'vertical' \| 'horizontal'`|`'horizontal'`|
|`wrap`|`boolean`|`true`|
|`softDisabled`|`boolean`|`true`|
|`focusMode`|`'roving' \| 'activedescendant'`|`'roving'`|
|`selectionMode`|`'follow' \| 'explicit'`|`'follow'`|
|`selectedTab`|`model<string \| undefined>`|`undefined` → `selectedTabChange`|
|`disabled`|`boolean`|`false`|

Публичное: `open(value: string): boolean`. Host: `role="tablist"`, `tabindex`, `aria-disabled`, `aria-orientation`, `aria-activedescendant`; listeners `keydown`, `pointerdown`, `focusin`.

#### `ngTab` — `[ngTab]`

|Input|Тип|По умолчанию|
|---|---|---|
|`value`|`string`|— **required**, ключ связи с панелью|
|`id`|`string`|авто `ng-tab-*`|
|`disabled`|`boolean`|`false`|

Публичное: `active`, `selected`, `open()`. Host: `role="tab"`, `id`, `tabindex`, `aria-selected`, `aria-disabled`, `aria-controls`, `data-active`.

#### `ngTabPanel` — `[ngTabPanel]`

|Input|Тип|По умолчанию|
|---|---|---|
|`value`|`string`|— **required**|
|`id`|`string`|авто `ng-tabpanel-*`|
|`preserveContent`|`boolean`|`false`|

Публичное: `visible`. Host: `role="tabpanel"`, `id`, `tabindex` (панель фокусируема — по APG), `aria-labelledby` (= id таба), `inert` когда скрыта.

#### `ngTabContent` — `ng-template[ngTabContent]`

Ленивый рендер.

### 6.2. Клавиатура (на `ngTabList`)

|Клавиша|`selectionMode='follow'`|`'explicit'`|
|---|---|---|
|←/→ (horizontal) или ↑/↓ (vertical), с RTL-инверсией|перейти и открыть|только перейти|
|Home / End|первый / последний + открыть|только перейти|
|Enter / Space|открыть активный|открыть активный|

Указатель: клик по табу — перейти и открыть (всегда).

### 6.3. Минимальный скелет

```html
<div ngTabs>
  <div ngTabList [(selectedTab)]="tab">
    <button ngTab value="general">Общие</button>
    <button ngTab value="security">Безопасность</button>
  </div>
  <div ngTabPanel value="general"><ng-template ngTabContent>…</ng-template></div>
  <div ngTabPanel value="security"><ng-template ngTabContent>…</ng-template></div>
</div>
```

---

## 7. Listbox

Entry: `@angular/aria/listbox`. Паттерн WAI-ARIA: Listbox. Также основа для Autocomplete/Select/Multiselect (раздел 12).

### 7.1. Директивы

#### `ngListbox<V>` — `[ngListbox]`

|Input / model|Тип|По умолчанию|Описание|
|---|---|---|---|
|`id`|`string`|авто `ng-listbox-*`||
|`orientation`|`'vertical' \| 'horizontal'`|`'vertical'`||
|`multi`|`boolean`|`false`|Множественный выбор|
|`wrap`|`boolean`|`true`||
|`softDisabled`|`boolean`|`true`||
|`focusMode`|`'roving' \| 'activedescendant'`|`'roving'`||
|`selectionMode`|`'follow' \| 'explicit'`|`'follow'`||
|`typeaheadDelay`|`number` (мс)|`500`||
|`disabled`|`boolean`|`false`||
|`readonly`|`boolean`|`false`|Навигация есть, выбор запрещён|
|`values`|`model<V[]>`|`[]`|`[(values)]` → `valuesChange`|

Публичное: `element`, `scrollActiveItemIntoView(options = {block: 'nearest'})`, `gotoFirst()`. **Прокрутку к активному элементу директива сама не делает** — вызывайте `scrollActiveItemIntoView()` (например, в `afterRenderEffect`, отслеживающем активный элемент), если список прокручиваемый.

Host: `role="listbox"`, `id`, `tabindex`, `aria-readonly`, `aria-disabled`, `aria-orientation`, `aria-multiselectable`, `aria-activedescendant`; listeners `keydown`, `pointerdown`, `focusin`. hostDirectives: `ComboboxPopup` (связь с `ngCombobox`, если он есть выше).

Dev-mode проверка: при `multi=false` и `values.length > 1` в консоль пишется `console.error`. **Автоочистка `values`:** если в `values` есть значение, для которого больше нет `ngOption` (например, отфильтровано), оно **удаляется из модели** (`afterRenderEffect`). Учитывайте это при фильтрации списка.

#### `ngOption<V>` — `[ngOption]`

|Input|Тип|По умолчанию|Описание|
|---|---|---|---|
|`value`|`V`|— **required**||
|`id`|`string`|авто `ng-option-*`||
|`disabled`|`boolean`|`false`||
|`label`|`string \| undefined`|`undefined`|Текст для typeahead (иначе `textContent`); в комбобоксе — текст, подставляемый в input|

Публичное: `element`, `active`, `selected`. Host: `role="option"`, `id`, `tabindex`, `aria-selected`, `aria-disabled`, `data-active`.

### 7.2. Клавиатура

Обозначения: «пред/след» — по `orientation`/RTL (3.4). Ctrl в таблице = Ctrl **или** ⌘.

**Навигация (все режимы, в т.ч. `readonly`):** пред/след, Home, End, typeahead.

|Комбинация|single + `follow`|single + `explicit`|multi + `follow`|multi + `explicit`|
|---|---|---|---|---|
|пред/след|перейти + выбрать только его|перейти|перейти + выбрать только его|перейти|
|Home/End|первый/последний + выбрать|перейти|то же + выбрать только его|перейти|
|typeahead|найти + выбрать|найти|найти + выбрать только его|найти|
|Space / Enter|—|toggleOne (выбрать/снять, остальные снять)|—|toggle активного|
|Ctrl+пред/след|—|—|перейти **без** изменения выбора|—|
|Ctrl+Space / Ctrl+Enter|—|—|toggle активного|—|
|Ctrl+Home/End|—|—|перейти без выбора|—|
|Ctrl+A|—|—|выбрать всё / снять всё + выбрать активный|выбрать/снять всё|
|Shift (нажатие)|—|—|запомнить якорь|запомнить якорь|
|Shift+пред/след|—|—|расширить диапазон|расширить диапазон|
|Ctrl+Shift+Home/End|—|—|диапазон до начала/конца|диапазон до начала/конца|
|Shift+Space / Shift+Enter|—|—|выбрать диапазон от якоря|выбрать диапазон от якоря|

Указатель: single+follow — выбрать; single+explicit — toggle; multi+follow — выбрать только его, Ctrl+клик — toggle; multi+explicit — toggle; Shift+клик (multi) — диапазон. `readonly` — только перемещение.

### 7.3. Минимальный скелет

```html
<ul ngListbox [(values)]="selected" [multi]="true" selectionMode="explicit" aria-label="Роли">
  @for (r of roles; track r.id) {
    <li ngOption [value]="r.id" [label]="r.name" [disabled]="r.locked">{{ r.name }}</li>
  }
</ul>
```

Доступное имя (`aria-label`/`aria-labelledby`) директива не задаёт — это ваша обязанность (и для всех остальных контейнеров тоже).

---

## 8. Toolbar

Entry: `@angular/aria/toolbar`. Паттерн WAI-ARIA: Toolbar. Фокус — всегда roving.

### 8.1. Директивы

#### `ngToolbar<V>` — `[ngToolbar]`

|Input / model|Тип|По умолчанию|
|---|---|---|
|`orientation`|`'vertical' \| 'horizontal'`|`'horizontal'`|
|`softDisabled`|`boolean`|`true`|
|`disabled`|`boolean`|`false`|
|`wrap`|`boolean`|`true`|
|`values`|`model<V[]>`|`[]` → `valuesChange` — значения «нажатых» виджетов|

Host: `role="toolbar"`, `tabindex`, `aria-disabled`, `aria-orientation`; listeners `keydown`, `click`, `pointerdown`, `focusin`.

#### `ngToolbarWidget<V>` — `[ngToolbarWidget]`

|Input|Тип|По умолчанию|
|---|---|---|
|`value`|`V`|— **required**|
|`id`|`string`|авто|
|`disabled`|`boolean`|`false`|

Публичное: `active`, `selected()`, `hardDisabled`. Host: `id`, `tabindex`, `aria-disabled`, `data-active`; при hard-disabled (`disabled` и `softDisabled=false`) — `disabled` + `inert`. **Роль не ставится** — используйте нативные `<button>` или задайте роль сами.

#### `ngToolbarWidgetGroup<V>` — `[ngToolbarWidgetGroup]`

|Input|Тип|По умолчанию|Описание|
|---|---|---|---|
|`disabled`|`boolean`|`false`|Отключает все виджеты группы|
|`multi`|`boolean`|`false`|`false` — выбор в группе взаимоисключающий (radio-подобный)|

Ни роли, ни атрибутов не ставит — `role="radiogroup"`/`group` и `aria-label` задавайте сами. **JSDoc-пример с `[(value)]` на группе неверен**: у группы нет модели; выбранные значения живут в `ngToolbar[(values)]`.

### 8.2. Клавиатура (на `ngToolbar`)

|Клавиша (horizontal; для vertical оси меняются)|Действие|
|---|---|
|←/→ (с RTL-инверсией)|Предыдущий/следующий виджет по всему тулбару|
|↑/↓|Внутри группы: предыдущий/следующий **с зацикливанием в пределах группы**; вне группы — ничего|
|Home / End|Первый / последний виджет|
|Enter / Space|Toggle значения активного виджета в `values` (в группе с `multi=false` — снимает остальные значения группы)|

Указатель: `pointerdown` — `preventDefault` (чтобы не терять фокус), `click` мышью — перейти + toggle.

### 8.3. Минимальный скелет

```html
<div ngToolbar [(values)]="pressed" aria-label="Форматирование">
  <button ngToolbarWidget value="bold" [attr.aria-pressed]="pressed().includes('bold')">B</button>
  <button ngToolbarWidget value="italic" [attr.aria-pressed]="pressed().includes('italic')">I</button>

  <div ngToolbarWidgetGroup role="radiogroup" aria-label="Выравнивание">
    <button ngToolbarWidget value="left"  role="radio" [attr.aria-checked]="pressed().includes('left')">L</button>
    <button ngToolbarWidget value="right" role="radio" [attr.aria-checked]="pressed().includes('right')">R</button>
  </div>
</div>
```

`aria-pressed`/`aria-checked` директивы **не выставляют** — только вы.

### 8.4. ⚠ Действия по Enter/Space

Enter/Space обрабатываются тулбаром с `preventDefault()`, а `click` с `pointerType === ''` (синтетический клик от клавиатуры) тулбар игнорирует. На практике **нативный `(click)` у кнопки при активации с клавиатуры не придёт** (браузер не генерирует click после отменённого keydown). Для кнопок-действий («Сохранить», «Печать») реагируйте на изменение `values` или вешайте свой `(keydown.enter)`/`(keydown.space)` на кнопку (он отработает раньше обработчика тулбара). Обязательно проверьте в своих целевых браузерах.

---

## 9. Tree

Entry: `@angular/aria/tree`. Паттерн WAI-ARIA: Tree View (+ навигационное дерево).

### 9.1. Директивы

#### `ngTree<V>` — `[ngTree]`

|Input / model|Тип|По умолчанию|Описание|
|---|---|---|---|
|`id`|`string`|авто `ng-tree-*`||
|`orientation`|`'vertical' \| 'horizontal'`|`'vertical'`||
|`multi`|`boolean`|`false`|Игнорируется при `nav=true`|
|`disabled`|`boolean`|`false`||
|`selectionMode`|`'follow' \| 'explicit'`|**`'explicit'`**||
|`focusMode`|`'roving' \| 'activedescendant'`|`'roving'`||
|`wrap`|`boolean`|`true`||
|`softDisabled`|`boolean`|`true`||
|`typeaheadDelay`|`number` (мс)|`500`||
|`values`|`model<V[]>`|`[]` → `valuesChange`||
|`nav`|`boolean`|`false`|Навигационное дерево: выбранный элемент получает `aria-current`, Enter не делает `preventDefault` (ссылки работают)|
|`currentType`|`'page' \| 'step' \| 'location' \| 'date' \| 'time' \| 'true' \| 'false'`|`'page'`|Значение `aria-current` при `nav`|

Публичное: `element`, `textDirection`, `scrollActiveItemIntoView(options?)`. Host: `role="tree"`, `id`, `tabindex`, `aria-orientation`, `aria-multiselectable`, `aria-disabled`, `aria-activedescendant`; listeners `keydown`, `pointerdown`, `focusin`. hostDirectives: `ComboboxPopup`.

#### `ngTreeItem<V>` — `[ngTreeItem]`

|Input / model|Тип|По умолчанию|Описание|
|---|---|---|---|
|`value`|`V`|— **required**||
|`parent`|`Tree<V> \| TreeItemGroup<V>`|— **required**|Корень или группа-родитель|
|`id`|`string`|авто||
|`disabled`|`boolean`|`false`||
|`selectable`|`boolean`|`true`|`false` — узел-папка без выбора|
|`expanded`|`model<boolean>`|`false` → `expandedChange`||
|`label`|`string \| undefined`|`undefined`|для typeahead|

Публичное: `active`, `level`, `selected`, `visible` (все предки раскрыты), `tree`. Host: `role="treeitem"`, `id`, `tabindex`, `aria-expanded` (только у узлов с группой), `aria-selected`, `aria-current`, `aria-disabled`, `aria-level`, `aria-setsize`, `aria-posinset`, `data-active`. `TreeItem` сам является `DeferredContentAware` — его `ngTreeItemGroup` рендерится лениво при раскрытии.

#### `ngTreeItemGroup<V>` — `ng-template[ngTreeItemGroup]`

|Input|Тип|Описание|
|---|---|---|
|`ownedBy`|`TreeItem<V>`|**required**, узел-владелец|

Наличие группы делает узел раскрываемым. Обёртку с `role="group"` (`<ul role="group">`) ставите вы.

### 9.2. Клавиатура (vertical, LTR; для RTL ←/→ меняются; для horizontal оси меняются)

|Клавиша|Действие|
|---|---|
|↑ / ↓|Предыдущий / следующий **видимый** узел (`follow`: + выбрать только его)|
|→|Свёрнут → раскрыть; раскрыт → к первому ребёнку|
|←|Раскрыт → свернуть; иначе → к родителю|
|Home / End|Первый / последний видимый|
|typeahead|Поиск|
|Shift + `*`|Раскрыть всех соседей активного узла|
|Space|`explicit`+single: выбрать только его; `explicit`+multi: toggle|
|Enter|То же, что Space (при `nav=true` без `preventDefault`)|
|Ctrl/⌘+A|`explicit`+multi: выбрать/снять всё; `follow`+multi: выбрать всё / снять всё + выбрать активный|
|Ctrl/⌘ + ↑↓→←, Home/End|`follow`+multi: перемещение без изменения выбора|
|Ctrl/⌘ + Space/Enter|`follow`+multi: toggle|
|Shift-диапазоны|как в Listbox (Shift+↑↓, Ctrl+Shift+Home/End, Shift+Space/Enter)|

Указатель: single — выбрать; multi+follow — выбрать только его, Ctrl+клик — toggle; multi+explicit — toggle; Shift+клик — диапазон. **Любой клик по узлу также переключает его раскрытие** (`TreePattern.goto` вызывает `toggleExpansion`) — если нужен раскрывающий «шеврон» отдельно от выбора, это придётся перехватывать.

### 9.3. Минимальный скелет (рекурсивный)

```html
<ul ngTree #tree="ngTree" [(values)]="selected" aria-label="Файлы">
  <ng-template [ngTemplateOutlet]="nodes" [ngTemplateOutletContext]="{ $implicit: data, parent: tree }" />
</ul>

<ng-template #nodes let-items let-parent="parent">
  @for (n of items; track n.id) {
    <li ngTreeItem #item="ngTreeItem" [parent]="parent" [value]="n.id" [label]="n.name">
      {{ n.name }}
      @if (n.children?.length) {
        <ul role="group">
          <ng-template ngTreeItemGroup [ownedBy]="item" #group="ngTreeItemGroup">
            <ng-template [ngTemplateOutlet]="nodes" [ngTemplateOutletContext]="{ $implicit: n.children, parent: group }" />
          </ng-template>
        </ul>
      }
    </li>
  }
</ng-template>
```

Скрывать свёрнутые `<ul role="group">` визуально — ваша задача (по `aria-expanded` родителя).

---

## 10. Menu / MenuBar

Entry: `@angular/aria/menu`. Паттерны WAI-ARIA: Menu Button, Menu, Menubar. Фокус — всегда roving, ориентация меню — vertical, менюбара — horizontal (зашито).

### 10.1. Директивы

#### `ngMenuTrigger<V>` — `[ngMenuTrigger]`

|Input|Тип|По умолчанию|
|---|---|---|
|`menu`|`Menu<V> \| undefined`|`undefined`|
|`disabled`|`boolean`|`false`|
|`softDisabled`|`boolean`|`true`|

Публичное: `expanded`, `hasPopup`, `open()` (фокус на первый пункт), `close()`. Host: `tabindex`, `disabled` (если `!softDisabled && disabled`), `aria-disabled`, `aria-haspopup`, `aria-expanded`, `aria-controls` (= id меню); listeners `click`, `keydown`, `focusin`, `focusout`. **Роль не выставляется** (паттерн «знает» `button`) — используйте `<button>`. Триггер регистрирует себя как `parent` меню через `effect`.

#### `ngMenu<V>` — `[ngMenu]`

|Input / output|Тип|По умолчанию|
|---|---|---|
|`id`|`string`|авто `ng-menu-*`|
|`wrap`|`boolean`|`true`|
|`typeaheadDelay`|`number` (мс)|`500`|
|`disabled`|`boolean`|`false`|
|`expansionDelay`|`number` (мс)|`100` — задержка раскрытия/закрытия подменю при hover|
|`preserveContent`|`boolean`|`false`|
|**output** `itemSelected`|`V`|значение выбранного пункта (эмитит **корневое** меню цепочки)|

Публичное: `visible`, `tabIndex`, `parent: WritableSignal<MenuTrigger | MenuItem | undefined>`, `close()`. Host: `role="menu"`, `id`, `aria-disabled`, `tabindex`, `data-visible`; listeners `keydown`, `mouseover`, `mouseout`, `focusin`, `focusout`, `click`. Меню без триггера/родителя считается корневым и всегда `visible` (inline-меню). **Позиционирование и скрытие — ваши** (CDK Overlay или CSS по `data-visible`).

#### `ngMenuBar<V>` — `[ngMenuBar]`

|Input / model / output|Тип|По умолчанию|
|---|---|---|
|`disabled`|`boolean`|`false`|
|`softDisabled`|`boolean`|`true`|
|`wrap`|`boolean`|`true`|
|`typeaheadDelay`|`number`|`500`|
|`values`|`model<V[]>`|`[]`|
|output `itemSelected`|`V`||

Публичное: `close()`. Host: `role="menubar"`, `tabindex`, `aria-disabled`, `disabled`; listeners `keydown`, `mouseover`, `click`, `focusin`, `focusout`. Пункты верхнего уровня — это `ngMenuItem` с `[submenu]` (а не `ngMenuTrigger`, вопреки JSDoc-примеру в v21).

#### `ngMenuItem<V>` — `[ngMenuItem]`

|Input / model|Тип|По умолчанию|
|---|---|---|
|`value`|`V`|— **required** (в v21 даже у пунктов-подменю)|
|`id`|`string`|авто `ng-menu-item-*`|
|`disabled`|`boolean`|`false`|
|`searchTerm`|`model<string>`|`''` — текст для typeahead|
|`submenu`|`Menu<V> \| undefined`|`undefined`|

Публичное: `parent` (ближайший `ngMenu`/`ngMenuBar` по DI), `active`, `expanded`, `hasPopup`, `open()`, `close()`. Host: `role="menuitem"`, `tabindex`, `aria-haspopup`, `aria-expanded`, `aria-disabled`, `aria-controls`, `data-active`; listener `focusin`. `menuitemcheckbox`/`menuitemradio` в v21 не поддерживаются (появилось в v22, input `role`). **Typeahead работает только при заданном `searchTerm`** (по умолчанию пустая строка, `textContent` не используется).

#### `ngMenuContent` — `ng-template[ngMenuContent]`

Ленивый рендер пунктов меню. Контент подменю создаётся, когда меню стало видимым или его родитель получил фокус; подменю пунктов менюбара рендерятся сразу.

### 10.2. Клавиатура

**На `ngMenuTrigger`:**

|Клавиша|Действие|
|---|---|
|Enter / Space / ↓|Открыть, фокус на первый пункт|
|↑|Открыть, фокус на последний пункт|
|Esc|Закрыть, вернуть фокус на триггер|
|клик|Toggle|

**На `ngMenu`:**

|Клавиша|Действие|
|---|---|
|↓ / ↑|Следующий / предыдущий пункт (закрывает открытое подменю текущего)|
|Home / End|Первый / последний|
|Enter / Space|Пункт с подменю → открыть (фокус на первый); иначе → выбрать: эмит `itemSelected`, закрыть всю цепочку, фокус на триггер|
|→ (LTR)|Пункт с подменю → открыть; иначе, если корень — менюбар → следующий пункт менюбара|
|← (LTR)|Это подменю → закрыть, фокус на родительский пункт; если родитель — менюбар → предыдущий пункт менюбара|
|Esc|Закрыть всю цепочку до корня|
|typeahead|Поиск по `searchTerm`|

**На `ngMenuBar`:**

|Клавиша|Действие|
|---|---|
|→ / ← (с RTL-инверсией)|Следующий / предыдущий пункт; если подменю было открыто — открыть подменю нового пункта|
|Home / End|Первый / последний|
|Enter / Space / ↓|Открыть подменю, фокус на первый|
|↑|Открыть подменю, фокус на последний|
|typeahead|Поиск|

Мышь: hover открывает подменю с задержкой `expansionDelay`, уход курсора закрывает; клик по пункту — выбрать/открыть. Потеря фокуса меню/менюбаром закрывает их.

### 10.3. Минимальные скелеты

```html
<!-- Menu button -->
<button ngMenuTrigger [menu]="actions">Действия</button>
<div ngMenu #actions="ngMenu" (itemSelected)="run($event)">
  <ng-template ngMenuContent>
    <div ngMenuItem value="copy" searchTerm="Копировать">Копировать</div>
    <div ngMenuItem value="more" searchTerm="Ещё" [submenu]="more">Ещё ›</div>
  </ng-template>
</div>
<div ngMenu #more="ngMenu">
  <ng-template ngMenuContent>
    <div ngMenuItem value="archive" searchTerm="Архивировать">Архивировать</div>
  </ng-template>
</div>

<!-- Menubar -->
<div ngMenuBar (itemSelected)="run($event)" aria-label="Главное меню">
  <div ngMenuItem value="file" searchTerm="Файл" [submenu]="file">Файл</div>
</div>
<div ngMenu #file="ngMenu">
  <div ngMenuItem value="new" searchTerm="Новый">Новый</div>
</div>
```

Подменю объявляются **вне** родителя (как соседние элементы или в overlay) — связь только через `[submenu]`/`[menu]`.

---

## 11. Grid

Entry: `@angular/aria/grid`. Паттерны WAI-ARIA: Grid / Data Grid / Layout Grid.

### 11.1. Директивы

#### `ngGrid` — `[ngGrid]`

|Input|Тип|По умолчанию|Описание|
|---|---|---|---|
|`enableSelection`|`boolean`|`false`|Включает выбор ячеек|
|`disabled`|`boolean`|`false`||
|`softDisabled`|`boolean`|`true`||
|`focusMode`|`'roving' \| 'activedescendant'`|`'roving'`||
|`rowWrap`|`'continuous' \| 'loop' \| 'nowrap'`|`'loop'`|Поведение ←/→ на краю строки: `loop` — в начало той же строки, `continuous` — на следующую/предыдущую строку, `nowrap` — стоп|
|`colWrap`|`'continuous' \| 'loop' \| 'nowrap'`|`'loop'`|То же для ↑/↓ в столбце|
|`multi`|`boolean`|`false`||
|`selectionMode`|`'follow' \| 'explicit'`|`'follow'`||
|`enableRangeSelection`|`boolean`|`false`|Shift-диапазоны и выделение перетаскиванием|

Host: `role="grid"`, `tabindex`, `aria-disabled`, `aria-multiselectable`, `aria-activedescendant`; listeners `keydown`, `pointerdown`, `pointerup`, `focusin`, `focusout`.

#### `ngGridRow` — `[ngGridRow]`

|Input|Тип|По умолчанию|
|---|---|---|
|`rowIndex`|`number \| undefined`|вычисляется|

Host: `role="row"`, `aria-rowindex`.

#### `ngGridCell` — `[ngGridCell]`

|Input / model|Тип|По умолчанию|Описание|
|---|---|---|---|
|`id`|`string`|авто||
|`role`|`'gridcell' \| 'columnheader' \| 'rowheader'`|`'gridcell'`||
|`rowSpan` / `colSpan`|`number`|`1`|Объединения учитываются при навигации|
|`rowIndex` / `colIndex`|`number \| undefined`|вычисляются|Для `aria-rowindex/colindex` (виртуализация)|
|`disabled`|`boolean`|`false`||
|`selected`|`model<boolean>`|`false` → `selectedChange`|Выбор хранится **в ячейке**, не в гриде|
|`selectable`|`boolean`|`true`||
|`orientation`|`'vertical' \| 'horizontal'`|`'horizontal'`|Навигация между несколькими виджетами в ячейке|
|`wrap`|`boolean`|`true`|То же|
|`tabindex`|`number \| undefined`|`undefined`|Ручное переопределение|

Атрибуты ставятся через `Renderer2` в `afterRenderEffect` (не host-биндинги): `role`, `id`, `rowspan`, `colspan`, `aria-rowspan`, `aria-colspan`, `data-active`, `data-anchor`, `aria-disabled`, `aria-rowindex`, `aria-colindex`, `aria-selected` (только при `enableSelection` и `selectable`), `tabindex`.

#### `ngGridCellWidget` — `[ngGridCellWidget]`

|Input / output|Тип|По умолчанию|Описание|
|---|---|---|---|
|`id`|`string`|авто||
|`widgetType`|`'simple' \| 'complex' \| 'editable'`|`'simple'`|см. ниже|
|`disabled`|`boolean`|`false`||
|`focusTarget`|`ElementRef \| HTMLElement \| undefined`|`undefined`|Куда реально ставить фокус (например, вложенный `<input>`)|
|`tabindex`|`number \| undefined`|`undefined`||
|output `activated`|`FocusEvent \| KeyboardEvent \| undefined`||Виджет «захватил» клавиатуру|
|output `deactivated`|то же||Отпустил|

Публичное: `isActivated`, `activate()`, `deactivate()`. Host: `id`, `tabindex`, `data-active`, `data-active-control`.

`widgetType`:

- `simple` — кнопка/чекбокс/ссылка: клавиши грида работают всегда, Enter/Space — нативные действия элемента.
- `complex` — виджет со своей навигацией (меню, комбобокс): Enter → активировать (грид ставит навигацию на паузу), Esc → деактивировать и вернуть фокус. Фокус внутрь виджета тоже активирует.
- `editable` — поле ввода: Enter или **печать буквы/цифры** → активировать (символ попадает в поле), Enter/Esc → деактивировать.

### 11.2. Клавиатура (на `ngGrid`)

Пока любой виджет/ячейка активирован(а) (`pauseNavigation`), грид клавиши **не обрабатывает**.

|Клавиша|Действие|
|---|---|
|↑ ↓ ← → (←/→ с RTL-инверсией)|Перемещение по ячейкам с учётом `rowWrap`/`colWrap`, spans, disabled|
|Home / End|Первая / последняя ячейка **строки**|
|Ctrl+Home / Ctrl+End|Первая / последняя ячейка **грида**|
|(при `enableSelection` + `follow`)|Любое перемещение выбирает только целевую ячейку|
|Enter / Space (`enableSelection` + `explicit`)|multi: toggle; single: toggleOne|
|Shift + стрелки/Home/End (`enableRangeSelection`)|Расширение диапазона от якоря|
|Ctrl+Shift+Home/End|Диапазон до начала/конца грида|
|Ctrl/⌘+A|Выбрать всё / снять всё|
|Shift+Space|Выбрать строку|
|Ctrl/⌘+Space|Выбрать столбец|

**На ячейке с несколькими виджетами:** Enter — войти в навигацию внутри ячейки (фокус на первый виджет), стрелки по `orientation` ячейки — между виджетами, Esc — выйти обратно на ячейку. ⚠ В 21.2.14 Home/End внутри ячейки оба вызывают `next()` (баг реализации). **На ячейке с одним виджетом** фокус сразу ставится на виджет, клавиши передаются ему.

Указатель: клик — фокус на ячейку (+выбор по режиму), Ctrl/⌘+клик — toggle (multi), Shift+клик — диапазон, перетаскивание — выделение диапазона (multi + range).

### 11.3. Минимальный скелет

```html
<table ngGrid [enableSelection]="true" [multi]="true" [enableRangeSelection]="true" aria-label="Расписание">
  <tr ngGridRow>
    @for (h of headers; track h) { <th ngGridCell role="columnheader">{{ h }}</th> }
  </tr>
  @for (row of rows; track row.id) {
    <tr ngGridRow>
      <td ngGridCell role="rowheader">{{ row.name }}</td>
      @for (c of row.cells; track c.id) {
        <td ngGridCell [(selected)]="c.selected" [disabled]="c.locked">{{ c.value }}</td>
      }
      <td ngGridCell>
        <input ngGridCellWidget widgetType="editable" [(ngModel)]="row.note" aria-label="Заметка" />
      </td>
    </tr>
  }
</table>
```

---

## 12. Combobox

Entry: `@angular/aria/combobox`. Паттерн WAI-ARIA: Combobox (popup: listbox, tree, dialog). **Внимание:** в v22 этот API переписан полностью (раздел 14.2).

### 12.1. Директивы

#### `ngCombobox<V>` — `[ngCombobox]` (обёртка вокруг input и попапа)

|Input|Тип|По умолчанию|Описание|
|---|---|---|---|
|`filterMode`|`'manual' \| 'auto-select' \| 'highlight'`|`'manual'`|см. 12.2|
|`disabled`|`boolean`|`false`||
|`readonly`|`boolean`|`false`|**Режим Select**: ввод запрещён, Enter/Space открывают; единственный режим, где работает `multi` у listbox|
|`firstMatch`|`V \| undefined`|`undefined`|Для tree-попапа: значение «первого совпадения» при фильтрации (для listbox берётся первый `ngOption`)|
|`alwaysExpanded`|`boolean`|`false`|Попап всегда открыт (Esc не закрывает)|
|`preserveContent`|`boolean`|`false`||

Публичное: `expanded: Signal<boolean>`, `popup`, `inputElement`, `open()` (фокус на выбранный), `close()`. Host: `data-expanded`; listeners `input`, `keydown`, `click`, `focusin`, `focusout` (всё обрабатывается на обёртке). Попап рендерится лениво при первом фокусе комбобокса и **не скрывается сам** — показывайте/прячьте по `expanded()` (`cdkConnectedOverlayOpen`, CSS по `data-expanded`/`aria-expanded`).

#### `ngComboboxInput` — `input[ngComboboxInput]`

|Model|Тип|По умолчанию|
|---|---|---|
|`value`|`model<string>`|`''` → `valueChange` — текст поля (это **строка запроса**, не выбранное значение)|

Host: `role="combobox"`, `value`, `aria-disabled`, `aria-expanded`, `aria-activedescendant`, `aria-controls` (= id попапа), `aria-haspopup` (`listbox`/`tree`/`dialog`), `aria-autocomplete` (`both` при `highlight`, иначе `list`), `readonly`.

#### `ngComboboxPopupContainer` — `ng-template[ngComboboxPopupContainer]`

Ленивый контейнер попапа. Внутри — `ngListbox`, `ngTree` или `dialog[ngComboboxDialog]`. При использовании CDK Overlay шаблон с `cdkConnectedOverlay` кладётся **внутрь** него.

#### `ngComboboxDialog` — `dialog[ngComboboxDialog]`

Только на нативном `<dialog>`. Открывается `showModal()` при `expanded`, закрывается `close()`; Esc и клик по backdrop закрывают. Публичное: `close()`. Host: `data-open`.

#### `ngComboboxPopup` — `[ngComboboxPopup]`

Служебный мост (hostDirective у `ngListbox`, `ngTree`, `ngComboboxDialog`). Вручную не ставится.

**Что меняется у listbox/tree внутри комбобокса:** паттерн заменяется на `ComboboxListboxPattern`/`ComboboxTreePattern`: `focusMode` принудительно `activedescendant`, «фокус-элемент» — `<input>`, у listbox `tabindex=-1`, собственные `keydown/pointerdown` listbox'а отключены (всё идёт через комбобокс), `multi` действует только при `readonly` комбобокса.

### 12.2. `filterMode`

|Режим|Поведение|
|---|---|
|`manual`|Фильтрация — ваша. При вводе активным становится первый совпадающий элемент, но **выбор не меняется**. При уходе фокуса выбирается опция, чей `label` точно равен тексту поля.|
|`auto-select`|Навигация и ввод автоматически **выбирают** активную/первую совпадающую опцию; при уходе фокуса значение коммитится в поле.|
|`highlight`|Как `auto-select` + inline-автодополнение: в поле дописывается остаток `label` первой опции и выделяется (`aria-autocomplete="both"`).|

Фильтровать список (`@for (o of filtered())`) всегда должны вы, по `ngComboboxInput[(value)]`.

### 12.3. Клавиатура (фокус всегда на `<input>`)

**Попап закрыт:**

|Клавиша|Действие|
|---|---|
|↓|Открыть, активна первая опция|
|↑|Открыть, активна последняя|
|Enter / Space (только `readonly`)|Открыть, активна выбранная|
|Esc|Не `readonly`: очистить поле и выбор (reset); `readonly`: закрыть|
|ввод текста (не `readonly`)|Открыть + фильтрация|

**Попап открыт (listbox/tree):**

|Клавиша|Действие|
|---|---|
|↓ / ↑|Следующая / предыдущая опция (+выбор при `auto-select`/`highlight`)|
|Home / End|Первая / последняя|
|Enter (listbox)|Выбрать, вписать в поле; закрыть (если не multi)|
|Space (`readonly`)|Выбрать/toggle; закрыть (если не multi)|
|→ / ← (tree, с RTL-инверсией)|Раскрыть / свернуть узел|
|Enter (tree)|Выбираемый узел → выбрать и закрыть; невыбираемый раскрываемый → раскрыть|
|Esc|Закрыть (не `readonly` — сбросить выбор, если текст не совпадает)|

**Попап-диалог:** ↓/↑ открывают; Esc внутри диалога закрывает. Клик по `<input>` в `readonly` — toggle; клик по опции — выбрать, вернуть фокус в input. Уход фокуса за пределы обёртки `ngCombobox` — коммит (по `filterMode`) и закрытие.

### 12.4. Минимальные скелеты

```html
<!-- Autocomplete -->
<div ngCombobox filterMode="auto-select">
  <input ngComboboxInput [(value)]="query" aria-label="Страна" />
  <ng-template ngComboboxPopupContainer>
    <div ngListbox [(values)]="country">
      @for (c of filtered(); track c) { <div ngOption [value]="c" [label]="c">{{ c }}</div> }
    </div>
  </ng-template>
</div>

<!-- Select (single) / Multiselect: readonly + невидимый input как фокус-цель -->
<div ngCombobox readonly #cb="ngCombobox">
  <div #origin class="select-trigger">
    <span>{{ display() }}</span>
    <input ngComboboxInput aria-label="Статус" class="visually-transparent" />
  </div>
  <ng-template ngComboboxPopupContainer>
    <ng-template [cdkConnectedOverlay]="{origin, usePopover: 'inline', matchWidth: true}"
                 [cdkConnectedOverlayOpen]="cb.expanded()">
      <div ngListbox [(values)]="statuses" [multi]="isMulti">
        @for (s of all; track s) { <div ngOption [value]="s" [label]="s">{{ s }}</div> }
      </div>
    </ng-template>
  </ng-template>
</div>
```

Для Select официальные примеры v21 делают `<input>` прозрачным (`opacity: 0`) поверх триггера — он принимает фокус, клавиатуру и несёт ARIA.

---

## 13. Слой `@angular/aria/private`

Используйте, когда готовой директивы нет (или её разметка не подходит), но нужна та же клавиатурная логика. **Нестабильный API**: закрепляйте точную версию и покрывайте тестами.

### 13.1. Что экспортируется (21.2.14)

|Группа|Символы|
|---|---|
|Паттерны|`AccordionGroupPattern`, `AccordionTriggerPattern`, `TabListPattern`, `TabPattern`, `TabPanelPattern`, `ListboxPattern`, `OptionPattern`, `ToolbarPattern`, `ToolbarWidgetPattern`, `ToolbarWidgetGroupPattern`, `TreePattern`, `TreeItemPattern`, `MenuPattern`, `MenuBarPattern`, `MenuItemPattern`, `MenuTriggerPattern`, `GridPattern`, `GridRowPattern`, `GridCellPattern`, `GridCellWidgetPattern`, `ComboboxPattern`, `ComboboxDialogPattern`, `ComboboxListboxPattern`, `ComboboxTreePattern`|
|Типы входов|`*Inputs` для каждого паттерна, `ListboxInputs`, `TreeInputs`, `ComboboxListboxInputs`, `ComboboxTreeInputs`, `ComboboxListboxControls`, `ComboboxTreeControls`|
|Ленивый контент|`DeferredContent`, `DeferredContentAware`|
|Сигналы|`SignalLike`, `WritableSignalLike`, `signal`, `computed`, `linkedSignal`, `convertGetterSetterToWritableSignalLike`, `untracked`|

**Не экспортируются** (доступны только как поля паттернов): `List`, `ListFocus`, `ListNavigation`, `ListSelection`, `ListTypeahead`, `ListExpansion`, `Tree` (behavior), `Grid` (behavior), `KeyboardEventManager`, `PointerEventManager`, `Modifier`. Своих клавиатурных менеджеров из пакета не построить — пишите карту клавиш сами и вызывайте методы поведения.

### 13.2. Контракт паттерна

Любой паттерн:

- принимает объект входов из `SignalLike`/`WritableSignalLike` (Angular `Signal`/`InputSignal`/`ModelSignal` подходят напрямую);
- отдаёт вычисляемые сигналы для атрибутов (`tabIndex`, `activeDescendant`, `disabled`, `orientation`, `multi`, …);
- предоставляет обработчики `onKeydown(e)`, `onPointerdown(e)` (+ `onFocusIn/onFocusOut/onClick/onMouseOver` у меню/комбобокса/грида);
- предоставляет `setDefaultState()` — вызывать до первого фокуса;
- у списочных — `validate(): string[]` для dev-проверок.

Директива-обёртка обязана: создать паттерн, связать детей с родителем (дочерний паттерн получает `SignalLike` на родительский), выставить host-атрибуты, повесить listeners и вызвать `setDefaultState()`.

### 13.3. Входы базового списка (`ListInputs<T, V>`)

Это пересечение входов поведений; его требуют `ListboxPattern` (+`id`, `readonly`), `MenuPattern`, `MenuBarPattern`, `ToolbarPattern` (без `multi/typeaheadDelay/selectionMode/focusMode` + `getItem`), и в составе `TreeInputs`.

|Вход|Тип|Поведение|
|---|---|---|
|`items`|`SignalLike<T[]>`|все — порядок навигации|
|`activeItem`|`WritableSignalLike<T \| undefined>`|ListFocus — **создавайте `signal(undefined)` сами**|
|`element`|`SignalLike<HTMLElement \| undefined>`|ListFocus — контейнер (для activedescendant)|
|`focusMode`|`'roving' \| 'activedescendant'`|ListFocus|
|`disabled`, `softDisabled`|`boolean`|ListFocus|
|`wrap`|`boolean`|ListNavigation|
|`orientation`|`'vertical' \| 'horizontal'`|ListNavigation|
|`textDirection`|`'ltr' \| 'rtl'`|ListNavigation|
|`multi`|`boolean`|ListSelection|
|`values`|`WritableSignalLike<V[]>`|ListSelection|
|`selectionMode`|`'follow' \| 'explicit'`|ListSelection|
|`typeaheadDelay`|`number`|ListTypeahead|

Элемент (`ListItem<V>`): `id`, `element`, `disabled`, `value`, `selectable`, `searchTerm` (все `SignalLike`). `OptionInputs` дополнительно требует `listbox: SignalLike<ListboxPattern>`; `index`/`selectable` вычисляются.

### 13.4. API поведений (через поля паттернов)

`pattern.listBehavior: List` (Listbox, Menu, MenuBar, Toolbar): `first/last/next/prev(opts?)`, `goto(item, opts?)`, `unfocus()`, `anchor(index)`, `search(char, opts?)`, `isTyping()`, `select(item?)`, `selectOne()`, `deselect(item?)`, `deselectAll()`, `toggle(item?)`, `toggleOne()`, `toggleAll()`, `isFocusable(item)`, `updateSelection(opts?)`, `getItemTabindex(item)`, сигналы `activeIndex`, `activeDescendant`, `tabIndex`; вложенные `focusBehavior`, `navigationBehavior` (`peekNext/peekPrev/peekFirst/peekLast`), `selectionBehavior` (`selectRange`, `selectAll`, `beginRangeSelection`), `typeaheadBehavior`.

`NavOptions`: `{ toggle?, select?, selectOne?, selectRange?, anchor?, focusElement?, items? }` — что сделать после успешного перемещения. `focusElement: false` — переместить «активный» без вызова `.focus()` (нужно для activedescendant/hover).

`TreePattern.treeBehavior: Tree` — то же + `firstChild/lastChild/nextSibling/prevSibling/parent`, `toggleExpansion/expand/collapse/expandSiblings/expandAll/collapseAll`, `isExpandable`.

`GridPattern.gridBehavior: Grid` — `up/down/left/right/first/last/firstInRow/lastInRow(opts?)`, `gotoCell(cell, opts?)`, `select/deselect/toggle/toggleOne/selectAll/deselectAll/selectRow/selectCol`, `setDefaultState()`, `resetState()`; плюс `data` (`getCell({row,col})`, `getCoords(cell)`), `focusBehavior`, `navigationBehavior` (`peek(direction, from, wrap?)`, `advance({row|col: ±1})`), `selectionBehavior` (`undo()`).

### 13.5. Пример: собственная директива поверх `ListboxPattern`

Чип-лист с горизонтальной навигацией и своим сочетанием Delete — разметка полностью ваша, клавиатура из пакета:

```ts
import {
  Directive, ElementRef, afterRenderEffect, booleanAttribute, computed,
  contentChildren, forwardRef, inject, input, model, output, signal,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { _IdGenerator } from '@angular/cdk/a11y';
import { ListboxPattern, OptionPattern } from '@angular/aria/private';

@Directive({
  selector: '[appChipList]',
  host: {
    role: 'listbox',
    '[attr.id]': 'id',
    '[attr.tabindex]': 'pattern.tabIndex()',
    '[attr.aria-orientation]': 'pattern.orientation()',
    '[attr.aria-multiselectable]': 'pattern.multi()',
    '[attr.aria-activedescendant]': 'pattern.activeDescendant()',
    '(keydown)': 'onKeydown($event)',
    '(pointerdown)': 'pattern.onPointerdown($event)',
    '(focusin)': 'hasFocused.set(true)',
  },
})
export class ChipList<V> {
  readonly id = inject(_IdGenerator).getId('app-chip-list-');
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly chips = contentChildren<Chip<V>>(forwardRef(() => Chip), { descendants: true });

  readonly values = model<V[]>([]);
  readonly multi = input(true, { transform: booleanAttribute });
  readonly removeRequested = output<V>();
  protected readonly hasFocused = signal(false);

  readonly pattern: ListboxPattern<V> = new ListboxPattern<V>({
    id: () => this.id,
    items: computed(() => this.chips().map(c => c.pattern)),
    activeItem: signal(undefined),
    element: () => this.host,
    textDirection: inject(Directionality).valueSignal,
    orientation: () => 'horizontal',
    focusMode: () => 'roving',
    selectionMode: () => 'explicit',
    multi: this.multi,
    values: this.values,
    wrap: () => true,
    softDisabled: () => true,
    disabled: () => false,
    readonly: () => false,
    typeaheadDelay: () => 500,
  });

  constructor() {
    afterRenderEffect(() => { if (!this.hasFocused()) this.pattern.setDefaultState(); });
  }

  onKeydown(e: KeyboardEvent) {
    // Своя клавиша — ДО делегирования паттерну.
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const active = this.pattern.inputs.activeItem();
      if (active) { this.removeRequested.emit(active.value()); e.preventDefault(); }
      return;
    }
    this.pattern.onKeydown(e);
  }
}

@Directive({
  selector: '[appChip]',
  host: {
    role: 'option',
    '[attr.id]': 'pattern.id()',
    '[attr.tabindex]': 'pattern.tabIndex()',
    '[attr.aria-selected]': 'pattern.selected()',
    '[attr.aria-disabled]': 'pattern.disabled()',
    '[attr.data-active]': 'pattern.active()',
  },
})
export class Chip<V> {
  private readonly list: ChipList<V> = inject(ChipList);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  readonly value = input.required<V>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly label = input<string>();
  private readonly uid = inject(_IdGenerator).getId('app-chip-');

  readonly pattern: OptionPattern<V> = new OptionPattern<V>({
    id: () => this.uid,
    value: this.value,
    disabled: this.disabled,
    element: () => this.host,
    searchTerm: computed(() => this.label() ?? this.host.textContent ?? ''),
    listbox: () => this.list.pattern,
  });
}
```

Ключевые моменты: (1) дети ссылаются на родительский паттерн лениво (`() => this.list.pattern`); (2) `activeItem` — ваш `signal`; (3) свои клавиши перехватываются до `pattern.onKeydown`, поэтому порядок полностью под контролем; (4) `setDefaultState()` до первого фокуса обязателен, иначе в roving-режиме ни у одного элемента не будет `tabindex=0`, и виджет станет недостижим по Tab.

---

## 14. Миграция на v22

Сверено: 21.2.14 → 22.0.0 → 22.1.0 → 22.2.2. **В пакете нет `ng update`-схематиков для aria** (папки `schematics` нет) — миграция ручная. `peerDependencies` v22: `@angular/cdk` той же версии, `@angular/core ^22 || ^23`. Ниже — все изменения публичных сигнатур директив; поведение внутри паттернов тоже менялось (клик теперь через `ClickEventManager` и т.п.), поэтому после миграции прогоните клавиатурные e2e-тесты.

### 14.1. Сводная таблица

|Где|v21|v22|С версии|
|---|---|---|---|
|`ngListbox`|`[(values)]` / `valuesChange`|`[(value)]` / `valueChange` (тип по-прежнему `V[]`)|22.0|
|`ngTree`|`[(values)]`|`[(value)]`|22.0|
|`ngMenuBar`|`[(values)]`|`[(value)]`|22.0|
|`ngToolbar`|`[(values)]`|`[(value)]` в 22.0–22.1; **удалено** в 22.2|22.0 / 22.2|
|`ngToolbarWidget`|`value` (required)|`value` удалён|22.2|
|`ngToolbarWidgetGroup`|`multi`|`multi` удалён|22.2|
|`ngListbox`, `ngTree`, `ngGrid`|—|новый input `tabindex` (`tabIndex`)|22.0|
|`ngListbox`, `ngGrid`|—|новый сигнал `activeDescendant`|22.0|
|`ngListbox`|—|метод `gotoIndex(index)`|22.0|
|`ngListbox`, `ngTree`|hostDirective `ComboboxPopup`|убран; связь с комбобоксом через `ngComboboxWidget`|22.0|
|`ngGrid`|`enableRangeSelection`|удалён|22.0|
|`ngGrid`|—|`scrollActiveCellIntoView()`|22.0|
|`ngGridCell`|`orientation`, `wrap`|удалены (ячейка держит один виджет)|22.0|
|`ngGridCellWidget`|`focusTarget: ElementRef \| HTMLElement`|`focusTarget: ElementResolver<HTMLElement>`|22.0|
|`ngMenu`|—|новый `softDisabled`|22.0|
|`ngMenuItem`|`value` required|`value` опционален|22.2|
|`ngMenuItem`|роль только `menuitem`|input `role`: `'menuitem' \| 'menuitemcheckbox' \| 'menuitemradio'`|22.0|
|grid entry|—|экспорт токенов `GRID`, `GRID_ROW`, `GRID_CELL`|22.0|
|toolbar entry|—|экспорт `TOOLBAR_WIDGET_GROUP`|22.0|
|combobox|см. 14.2|**полностью новый API**|22.0|
|Тестирование|—|CDK-харнессы: `@angular/aria/{accordion,combobox,grid,listbox,menu,tabs,toolbar,tree}/testing`|22.0|

Accordion и Tabs: публичные сигнатуры не изменились.

### 14.2. Combobox: v21 → v22

|v21|v22|
|---|---|
|`ngCombobox` — обёртка|`ngCombobox` ставится **на сам триггер** (`<input>` — редактируемый, или `<div>` — select) и получает `role="combobox"`|
|`ngComboboxInput[(value)]`|`ngCombobox[(value)]` (строка)|
|`combobox.expanded()` (read-only)|`[(expanded)]` — `model<boolean>`|
|`ngComboboxPopupContainer`|`ng-template[ngComboboxPopup]` с **обязательным** `[combobox]="cb"` и `popupType` (`'listbox'` по умолчанию, `'tree' \| 'grid' \| 'dialog'`)|
|listbox/tree подключались автоматически (hostDirective)|на элемент виджета ставится `ngComboboxWidget` + `[activeDescendant]="listbox.activeDescendant()"`|
|`filterMode`, `firstMatch`|удалены; выбор по вводу — ваша логика. Для inline-автодополнения — input `inlineSuggestion`|
|`ngComboboxDialog`|удалён; диалог — `popupType="dialog"` + ваша разметка|
|—|новые inputs `softDisabled`, `tabindex`; `readonly` вернулся в 22.1|
|Комбобокс сам вызывал методы listbox|Комбобокс **ретранслирует** клавиатурные события (стрелки, Home/End, PageUp/PageDown, Enter, для не-input — Space/typeahead/Ctrl+A) в элемент виджета, а тот обрабатывает их своей клавиатурной картой|

Шаблон v22 (из JSDoc 22.2.2):

```html
<input ngCombobox #combobox="ngCombobox" [(value)]="query" [(expanded)]="open" />
<ng-template ngComboboxPopup [combobox]="combobox">
  <div ngComboboxWidget ngListbox #listbox="ngListbox"
       [(value)]="selected" [activeDescendant]="listbox.activeDescendant()">
    <div ngOption value="first">First</div>
  </div>
</ng-template>
```

### 14.3. Изменения слоя `private`

- Удалены: `ComboboxDialogPattern`, `ComboboxListboxPattern`, `ComboboxTreePattern`, `ComboboxListboxControls/TreeControls`.
- Новые: `ComboboxPopupPattern` (+`ComboboxPopupInputs`), `SortedCollection`, `sortDirectives`, `HasElement`, `ElementResolver`, `resolveElement`, `reportViolations`, `tabIndexTransform`.
- Директивы перешли с `contentChildren` на регистрацию в `SortedCollection` (детям нужны `ngOnInit/ngOnDestroy`) — если вы писали свои директивы по образцу v21 (раздел 13.5), они продолжат работать, но входы паттернов могли измениться: сверяйте `*Inputs`.

### 14.4. Чек-лист миграции

1. `[(values)]` → `[(value)]` на `ngListbox`, `ngTree`, `ngMenuBar` (поиск: `\[\(values\)\]|\(valuesChange\)|\.values\(\)`).
2. Toolbar: выбор/«нажатость» теперь полностью ваша — храните состояние сами, уберите `value` с `ngToolbarWidget` и `multi` с группы.
3. Grid: уберите `enableRangeSelection`, `orientation`/`wrap` у ячеек; ячейки с несколькими виджетами пересоберите (одна ячейка — один `ngGridCellWidget`); `focusTarget` переведите на `ElementResolver`.
4. Combobox: переписать по 14.2; логику `filterMode` (auto-select/highlight) перенести в компонент.
5. Меню: проверьте `value` у пунктов-подменю (теперь можно убрать), используйте `role="menuitemcheckbox|radio"` вместо самописных.
6. Свои директивы на `@angular/aria/private` — сверить `*Inputs` по `types/private.d.ts` целевой версии.
7. Заменить самописные тестовые утилиты на харнессы `@angular/aria/*/testing`.

---

## 15. Известные ловушки v21

|#|Ловушка|Что делать|
|---|---|---|
|1|JSDoc-примеры используют `[(value)]` на `ngListbox`/`ngTree`/`ngToolbarWidgetGroup`|В v21 модель — `values` (на группе тулбара модели нет вообще)|
|2|`ngListbox` удаляет из `values` значения без соответствующего `ngOption`|Не фильтруйте опции, если выбор должен сохраниться; храните «истинный» выбор отдельно|
|3|`multi` у listbox в комбобоксе работает только при `readonly`|Multiselect = `ngCombobox readonly` + `ngListbox [multi]="true"`|
|4|Enter/Space в тулбаре не дают нативный `click`|Реагируйте на `valuesChange` или свои `keydown` на кнопке|
|5|Обработанные клавиши `stopPropagation()`|Глобальные хоткеи на `document` не увидят стрелки/Enter внутри виджетов|
|6|Директивы ничего не скрывают|`inert`/`aria-expanded`/`data-visible` → ваш CSS; попапы → CDK Overlay|
|7|`aria-label`/`aria-labelledby` контейнеров не ставятся|Задавайте имя каждому `listbox`/`tree`/`grid`/`toolbar`/`menubar`|
|8|`ngMenuItem` typeahead работает только с `searchTerm`|Всегда задавайте `searchTerm`|
|9|`ngMenuItem.value` обязателен даже у пункта-подменю|Задайте любое значение|
|10|Grid: Home/End внутри ячейки с несколькими виджетами работают как «следующий»|Не полагайтесь на них или перехватывайте сами|
|11|Accordion: `multiExpandable` по умолчанию `true`, `wrap` — `false`|Для APG-аккордеона явно `[multiExpandable]="false"`|
|12|Нет автопрокрутки к активному элементу|`scrollActiveItemIntoView()` у Listbox/Tree|
|13|Роли не ставятся у `ngToolbarWidget`, `ngToolbarWidgetGroup`, `ngMenuTrigger`|Нативный `<button>` / явная `role`|
|14|`aria-pressed`/`aria-checked` в тулбаре не ставятся|Выставляйте сами по `values`|
|15|Tree: `typeaheadDelay` в JSDoc «секунды»|Это миллисекунды|

---

## 16. Чек-лист рабочего ARIA-компонента

Структура любого компонента на `@angular/aria`:

```
[Контейнер-директива]              ← role, tabindex, aria-*, ВСЕ клавиатурные listeners
  │   inputs: orientation, focusMode, selectionMode, multi, wrap, softDisabled, disabled
  │   model:  values / selectedTab / expanded
  │   + ваше доступное имя (aria-label / aria-labelledby)
  │
  ├── [Элемент-директива] × N      ← role, id, tabindex, aria-selected/expanded/disabled, data-active
  │       required: value (или panel / parent / ownedBy)
  │       optional: label / searchTerm, disabled
  │
  └── [ng-template *Content]        ← ленивый контент (опционально), preserveContent на родителе
```

Перед ревью компонента проверьте:

- [ ] Каждая дочерняя директива находится внутри требуемого предка (раздел 4); ссылочные связи (`[panel]`, `[parent]`, `[ownedBy]`, `[menu]`, `[submenu]`) указывают на правильные `#ref`.
- [ ] Все `required`-inputs заданы (`value`, `panel`, `parent`, `ownedBy`).
- [ ] У контейнера есть доступное имя.
- [ ] Используется `[(values)]` (v21), тип — массив.
- [ ] Выбраны осознанно `focusMode` и `selectionMode`; для `activedescendant` есть стиль по `[data-active]`.
- [ ] Скрытые панели/подменю/попапы скрыты визуально (CSS/Overlay), а не только `inert`.
- [ ] Для прокручиваемых списков вызывается `scrollActiveItemIntoView()`.
- [ ] Действия (не выбор) не завязаны на нативный `click` там, где виджет перехватывает Enter/Space.
- [ ] Ровно один элемент виджета в Tab-последовательности (Tab входит в виджет и выходит из него одним нажатием).
- [ ] Проверено в RTL (`dir="rtl"`) и в обеих ориентациях, если ориентация настраивается.
- [ ] Для своих директив на `private`: `setDefaultState()` до первого фокуса, ленивые ссылки дочерних паттернов на родительский, своя обработка клавиш до `pattern.onKeydown()`.
- [ ] Версия `@angular/aria` закреплена точно (developer preview), а при переходе на v22 пройден чек-лист 14.4.