# `<webui-rich-quill>` на ngx-tiptap

Собственный WYSIWYG-компонент на базе [ngx-tiptap](https://github.com/sibiraj-s/ngx-tiptap) (Angular-обёртка над Tiptap v3).

Возможности:

1. Заголовки `h1`–`h3`
2. Стили текста (bold / italic / underline / strike / code)
3. Вставка переменных (`{{ user.name }}`) как атомарной inline-ноды

Стек: **Angular 21** (standalone, signals, `input()` / `output()`, `ChangeDetectionStrategy.OnPush`), **less**.

## Что здесь реально от ngx-tiptap

Библиотека нужна только для одной вещи — `TiptapEditorDirective`, монтирующей `Editor` (ProseMirror) в DOM и синхронизирующей его с Angular change detection. Все команды форматирования (`toggleBold`, `toggleHeading` и т.д.) — обычный Tiptap API, ngx-tiptap здесь не участвует.

Намеренно **не** используется `AngularNodeViewRenderer`: интерактивность внутри чипа переменной не требуется, поэтому переменная — простая атомарная нода с `renderHTML`/`parseHTML`, без своего Angular-компонента, DI и жизненного цикла NodeView. Это самый дешёвый по коду вариант.

## Установка

```bash
npm i ngx-tiptap @tiptap/core @tiptap/starter-kit @tiptap/pm
```

`@tiptap/pm` — обязательная peer-зависимость (ProseMirror). `StarterKit` v3 уже включает `bold`, `italic`, `underline`, `strike`, `code`, `heading`, списки, `history` — отдельно ставить не нужно.

## Структура файлов

```
libs/webui/rich-quill/
├── src/lib/
│   ├── webui-rich-quill.component.ts
│   ├── webui-rich-quill.component.html
│   ├── webui-rich-quill.component.less
│   ├── webui-rich-quill.types.ts
│   └── extensions/
│       └── variable.node.ts
└── src/index.ts
```

---

## 1. Типы

`webui-rich-quill.types.ts`

```ts
/** Переменная, доступная для вставки в редактор. */
export interface RichVariable {
  /** Технический ключ, попадающий в разметку и в plain-text. */
  key: string;
  /** Человекочитаемая подпись в редакторе и в выпадающем списке. */
  label: string;
}

/** Активные в текущей позиции курсора форматы — для подсветки тулбара. */
export interface RichQuillState {
  h1: boolean;
  h2: boolean;
  h3: boolean;
  paragraph: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
}

export const EMPTY_RICH_QUILL_STATE: RichQuillState = {
  h1: false,
  h2: false,
  h3: false,
  paragraph: false,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
};
```

---

## 2. Нода переменной

`extensions/variable.node.ts`

Атомарная (`atom: true`) inline-нода: курсор внутрь не заходит, удаляется целиком, сериализуется в `<span data-key="...">`. Никакого NodeView и Injector — просто `renderHTML`/`parseHTML`.

```ts
import { mergeAttributes, Node } from '@tiptap/core';

import { RichVariable } from '../webui-rich-quill.types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      /** Вставляет переменную в текущую позицию курсора. */
      insertVariable: (variable: RichVariable) => ReturnType;
    };
  }
}

export const VariableNode = Node.create({
  name: 'variable',

  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      key: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-key') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-key': attributes['key'] }),
      },
      label: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-label') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-label': attributes['label'] }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-key]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ class: 'webui-rich-quill__variable' }, HTMLAttributes),
      `{{ ${node.attrs['label'] || node.attrs['key']} }}`,
    ];
  },

  /** Используется при `editor.getText()` и при копировании в plain-text. */
  renderText({ node }) {
    return `{{ ${node.attrs['key']} }}`;
  },

  addCommands() {
    return {
      insertVariable:
        (variable: RichVariable) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: { key: variable.key, label: variable.label } },
            // Пробел после атома, чтобы курсор не «залипал» на границе ноды.
            { type: 'text', text: ' ' },
          ]),
    };
  },
});
```

---

## 3. Компонент

`webui-rich-quill.component.ts`

Реализует `ControlValueAccessor`, поэтому работает и с `[(ngModel)]`, и с `formControlName`.

```ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Content, Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TiptapEditorDirective } from 'ngx-tiptap';

import { VariableNode } from './extensions/variable.node';
import {
  EMPTY_RICH_QUILL_STATE,
  RichQuillState,
  RichVariable,
} from './webui-rich-quill.types';

type HeadingLevel = 1 | 2 | 3;

@Component({
  selector: 'webui-rich-quill',
  templateUrl: './webui-rich-quill.component.html',
  styleUrl: './webui-rich-quill.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TiptapEditorDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WebuiRichQuillComponent),
      multi: true,
    },
  ],
  host: {
    'class': 'webui-rich-quill',
    '[class.webui-rich-quill_disabled]': 'disabled()',
  },
})
export class WebuiRichQuillComponent implements ControlValueAccessor, OnDestroy {
  /** Список переменных для выпадающего списка вставки. */
  readonly variables = input<readonly RichVariable[]>([]);
  readonly placeholder = input('');

  readonly contentChange = output<string>();

  protected readonly disabled = signal(false);
  protected readonly state = signal<RichQuillState>(EMPTY_RICH_QUILL_STATE);
  protected readonly variablesOpened = signal(false);

  protected readonly editor = new Editor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      VariableNode,
    ],
    editorProps: {
      attributes: { class: 'webui-rich-quill__content' },
    },
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.editor.on('transaction', () => this.state.set(this.readState()));
    this.editor.on('update', () => this.emitValue());
    this.editor.on('blur', () => this.onTouched());

    inject(DestroyRef).onDestroy(() => this.editor.destroy());

    effect(() => this.editor.setEditable(!this.disabled()));
  }

  ngOnDestroy(): void {
    if (!this.editor.isDestroyed) {
      this.editor.destroy();
    }
  }

  // ---- ControlValueAccessor -------------------------------------------------

  writeValue(value: Content): void {
    this.editor.commands.setContent(value ?? '', { emitUpdate: false });
    this.state.set(this.readState());
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- Тулбар ---------------------------------------------------------------

  protected toggleHeading(level: HeadingLevel): void {
    this.editor.chain().focus().toggleHeading({ level }).run();
  }

  protected setParagraph(): void {
    this.editor.chain().focus().setParagraph().run();
  }

  protected toggleBold(): void {
    this.editor.chain().focus().toggleBold().run();
  }

  protected toggleItalic(): void {
    this.editor.chain().focus().toggleItalic().run();
  }

  protected toggleUnderline(): void {
    this.editor.chain().focus().toggleUnderline().run();
  }

  protected toggleStrike(): void {
    this.editor.chain().focus().toggleStrike().run();
  }

  protected toggleCode(): void {
    this.editor.chain().focus().toggleCode().run();
  }

  protected toggleVariables(): void {
    this.variablesOpened.update((opened) => !opened);
  }

  protected insertVariable(variable: RichVariable): void {
    this.editor.chain().focus().insertVariable(variable).run();
    this.variablesOpened.set(false);
  }

  // ---- Приватная кухня ------------------------------------------------------

  private emitValue(): void {
    const value = this.editor.getHTML();

    this.onChange(value);
    this.contentChange.emit(value);
  }

  private readState(): RichQuillState {
    const editor = this.editor;

    return {
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      paragraph: editor.isActive('paragraph'),
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
    };
  }
}
```

`webui-rich-quill.component.html`

```html
<div class="webui-rich-quill__toolbar" role="toolbar" aria-label="Форматирование">
  <button
    type="button"
    class="webui-rich-quill__button"
    [class.webui-rich-quill__button_active]="state().paragraph"
    [disabled]="disabled()"
    title="Обычный текст"
    (click)="setParagraph()"
  >¶</button>

  @for (level of [1, 2, 3]; track level) {
    <button
      type="button"
      class="webui-rich-quill__button"
      [class.webui-rich-quill__button_active]="
        level === 1 ? state().h1 : level === 2 ? state().h2 : state().h3
      "
      [disabled]="disabled()"
      [title]="'Заголовок ' + level"
      (click)="toggleHeading($any(level))"
    >H{{ level }}</button>
  }

  <button
    type="button"
    class="webui-rich-quill__button webui-rich-quill__button_bold"
    [class.webui-rich-quill__button_active]="state().bold"
    [disabled]="disabled()"
    title="Полужирный"
    (click)="toggleBold()"
  >B</button>

  <button
    type="button"
    class="webui-rich-quill__button webui-rich-quill__button_italic"
    [class.webui-rich-quill__button_active]="state().italic"
    [disabled]="disabled()"
    title="Курсив"
    (click)="toggleItalic()"
  >I</button>

  <button
    type="button"
    class="webui-rich-quill__button webui-rich-quill__button_underline"
    [class.webui-rich-quill__button_active]="state().underline"
    [disabled]="disabled()"
    title="Подчёркнутый"
    (click)="toggleUnderline()"
  >U</button>

  <button
    type="button"
    class="webui-rich-quill__button webui-rich-quill__button_strike"
    [class.webui-rich-quill__button_active]="state().strike"
    [disabled]="disabled()"
    title="Зачёркнутый"
    (click)="toggleStrike()"
  >S</button>

  <button
    type="button"
    class="webui-rich-quill__button webui-rich-quill__button_code"
    [class.webui-rich-quill__button_active]="state().code"
    [disabled]="disabled()"
    title="Моноширинный"
    (click)="toggleCode()"
  >&lt;/&gt;</button>

  @if (variables().length > 0) {
    <div class="webui-rich-quill__group_variables">
      <button
        type="button"
        class="webui-rich-quill__button webui-rich-quill__button_wide"
        [class.webui-rich-quill__button_active]="variablesOpened()"
        [disabled]="disabled()"
        [attr.aria-expanded]="variablesOpened()"
        title="Вставить переменную"
        (click)="toggleVariables()"
      >{{ '{{ }}' }}</button>

      @if (variablesOpened()) {
        <ul class="webui-rich-quill__variables" role="listbox">
          @for (variable of variables(); track variable.key) {
            <li>
              <button
                type="button"
                class="webui-rich-quill__variables-button"
                role="option"
                (click)="insertVariable(variable)"
              >{{ variable.label }}</button>
            </li>
          }
        </ul>
      }
    </div>
  }
</div>

<div
  class="webui-rich-quill__editor"
  [editor]="editor"
  [attr.data-placeholder]="placeholder()"
  tiptap
></div>
```

> Если версия ngx-tiptap предоставляет компонентную обёртку вместо директивы, последний блок заменяется на `<tiptap-editor class="webui-rich-quill__editor" [editor]="editor" />`.

`webui-rich-quill.component.less`

```less
@webui-rich-quill-border: #d5d9e0;
@webui-rich-quill-accent: #3b6fd4;
@webui-rich-quill-muted: #6b7280;
@webui-rich-quill-hover: #f1f3f7;
@webui-rich-quill-radius: 6px;

:host {
  display: flex;
  flex-direction: column;
  border: 1px solid @webui-rich-quill-border;
  border-radius: @webui-rich-quill-radius;
  background: #ffffff;

  &.webui-rich-quill_disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.webui-rich-quill {
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 6px 8px;
    border-bottom: 1px solid @webui-rich-quill-border;
  }

  &__button {
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: @webui-rich-quill-muted;
    font-size: 13px;
    cursor: pointer;

    &:hover:not(:disabled) { background: @webui-rich-quill-hover; }
    &:disabled { cursor: default; opacity: 0.5; }

    &_active {
      background: fade(@webui-rich-quill-accent, 12%);
      color: @webui-rich-quill-accent;
    }

    &_wide { min-width: 44px; }
    &_bold { font-weight: 700; }
    &_italic { font-style: italic; }
    &_underline { text-decoration: underline; }
    &_strike { text-decoration: line-through; }
    &_code { font-family: monospace; }
  }

  &__group_variables {
    position: relative;
  }

  &__variables {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 10;
    min-width: 200px;
    max-height: 240px;
    margin: 0;
    padding: 4px;
    overflow-y: auto;
    list-style: none;
    border: 1px solid @webui-rich-quill-border;
    border-radius: @webui-rich-quill-radius;
    background: #ffffff;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
  }

  &__variables-button {
    display: block;
    width: 100%;
    padding: 6px 8px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    text-align: left;
    cursor: pointer;

    &:hover { background: @webui-rich-quill-hover; }
  }

  &__editor {
    display: block;
    padding: 12px;
  }

  // Контент внутри ProseMirror рендерится вне Angular-шаблона,
  // поэтому стили пробрасываются через ::ng-deep.
  ::ng-deep &__content {
    min-height: 160px;
    outline: none;

    h1 { font-size: 24px; margin: 0 0 12px; }
    h2 { font-size: 20px; margin: 0 0 10px; }
    h3 { font-size: 17px; margin: 0 0 8px; }
    p { margin: 0 0 8px; }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: @webui-rich-quill-muted;
      float: left;
      height: 0;
      pointer-events: none;
    }
  }

  ::ng-deep &__variable {
    padding: 1px 6px;
    border-radius: 10px;
    background: fade(@webui-rich-quill-accent, 12%);
    color: @webui-rich-quill-accent;
    font-size: 0.9em;
    white-space: nowrap;
  }
}
```

---

## 4. Использование

```ts
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { RichVariable, WebuiRichQuillComponent } from '@webui/rich-quill';

@Component({
  selector: 'app-template-editor',
  imports: [ReactiveFormsModule, WebuiRichQuillComponent],
  template: `
    <webui-rich-quill
      [formControl]="body"
      [variables]="variables()"
      placeholder="Введите текст шаблона"
    />
  `,
})
export class TemplateEditorComponent {
  protected readonly body = new FormControl('<p>Здравствуйте, </p>');

  protected readonly variables = signal<RichVariable[]>([
    { key: 'user.firstName', label: 'Имя пользователя' },
    { key: 'order.number', label: 'Номер заказа' },
  ]);
}
```

## Заметки

- **`setContent` и `emitUpdate`.** В `writeValue` обязательно `{ emitUpdate: false }`, иначе запись значения из формы вызовет `onChange` и форма уйдёт в `dirty` на инициализации.
- **Уничтожение редактора.** `editor.destroy()` вызывается через `DestroyRef`; без этого остаются висящие DOM-слушатели ProseMirror.
- **Плейсхолдер.** Селектор `p.is-editor-empty` работает, только если в `StarterKit`/extensions включён `Placeholder`; в v3 он уже входит в `StarterKit`.
- **Переменные в plain-text.** `renderText()` отдаёт `{{ key }}`, поэтому `editor.getText()` пригоден для отправки в шаблонизатор на бэкенде без обработки HTML.
- **Если понадобится интерактивность в чипе** (кнопка удаления, клик для редактирования) — тогда и только тогда есть смысл возвращаться к `AngularNodeViewRenderer` из ngx-tiptap; для текущей задачи это оверхед.
