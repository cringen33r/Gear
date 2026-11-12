
Библиотека для *реактивного управления состоянием* приложения.

# SignalStore

Создаётся через `signalStore`, в котором можно определить функции хранилища, наделяющие экземпляр состоянием, свойствами и методами для реализации хранилища. **Возвращает инжектируемый сервис.**

Функция `withState()` позволяет определять состояния хранилища.

```tsx
import { signalStore, withState } from '@ngrx/signals';
import { Book } from './book';

type BookSearchState = {
  books: Book[];
  isLoading: boolean;
  filter: { query: string; order: 'asc' | 'desc' };
};

const initialState: BookSearchState = {
  books: [],
  isLoading: false,
  filter: { query: '', order: 'asc' },
};

export const BookSearchStore = signalStore(
  withState(initialState)
);
```

Сначала определяем интерфейс состояния, задаём начальное значение, создаём экземпляр хранилища, в который вставляем состояние через `withState(initialState)`.

Для каждого свойства состояния создаются *Signal* и *DeepSignal*

Хранилище по умолчанию не регистрируется никакими инжекторами, потому нужно сначала вручную его зарегистрировать через *providers*, а уже потом инжектить. Если регистрируем в провайдерах на уровне компонента - хранилище локальное и привязано к жизненному циклу компонента.

Чтобы объявить глобально - нужно передать в `signalStore` передать `{ providedIn: 'root' }`

Можно добавить производные сигналы через `withComputed`, которая принимает функцию-фабрику, исполняемую в контексте инжекта. Фабрика должна возвращать словарь производных сигналов, используя определённые ранее сигналы.

```tsx
import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Book } from './book';

type BookSearchState = { /* ... */ };

const initialState: BookSearchState = { /* ... */ };

export const BookSearchStore = signalStore(
  withState(initialState),
  // 👇 Accessing previously defined state signals and properties.
  withComputed(({ books, filter }) => ({
    booksCount: computed(() => books().length),
    sortedBooks: computed(() => {
      const direction = filter.order() === 'asc' ? 1 : -1;

      return books().toSorted((a, b) =>
        direction * a.title.localeCompare(b.title)
      );
    }),
  }))
);
```

