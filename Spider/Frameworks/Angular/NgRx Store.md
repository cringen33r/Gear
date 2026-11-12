![[state-management-lifecycle.png]]
# Архитектура

## Actions

Действие является просто интерфейсом *Action* с одним единственным свойством `type:string`, содержащее строку типа *\[Source\] Event* для описания действия. Навешивается на объект дополнительная дата.

Правило UDMED

Upfront - сначала продумывание экшена, потом реализация.
Divide - категорировние
Many - не жалеть
Event-Driven - перехват не команды а события
Descriptive - описание

### Создание

Через `createAction`
```tsx
import { createAction, props } from '@ngrx/store';

export const login = createAction(
  '[Login Page] Login',
  props<{ username: string; password: string }>()
);
```

Через `store.dispatch`
```tsx
onSubmit(username: string, password: string) {
  store.dispatch(login({ username: username, password: password }));
}
```

Если передать анонимную функцию с вызовом сигнала, то произойдёт подписка как у эффекта, потому правила объявления такие же. Нужно объявлять в *injection context* либо вторым параметром передавать `{injector: this.injector}`, поскольку функции требуют привязки к контексту и они уничтожаются при уничтожении контекста.

`dispatch` возвращает `elementRef`, потому можно его сохранить в переменную и потом удалить вручную через `destroy()`.

## Reducers

Редуцеры - функции, ответственные за смену состояния на основании экшенов.

Состояние - это просто интерфейс, который мы задаём сами. Сначала задаём интерфейс, потом создаём объект дефолтного состояния.

```tsx
export const scoreboardReducer = createReducer(
  initialState,
  on(ScoreboardPageActions.homeScore, state => ({ ...state, home: state.home + 1 })),
  on(ScoreboardPageActions.awayScore, state => ({ ...state, away: state.away + 1 })),
  on(ScoreboardPageActions.resetScore, state => ({ home: 0, away: 0 })),
  on(ScoreboardPageActions.setScores, (state, { game }) => ({ home: game.home, away: game.away }))
);
```

Важно, что NgRx требует неизменяемости State, потому мы создаём новый объект состояния.


> [!IMPORTANT] spread-оператор
> Делает поверхностное копирование, потому для глубоко вложенных объектов нужен другой подход (lodash в помощь)

Отправленный экшен получают *ВСЕ* редуцеры, но обрабатывают лишь подходящие.

### Объявление хранилища

```tsx
import { bootstrapApplication } from '@angular/platform-browser';
import { provideStore, provideState } from '@ngrx/store';

import { AppComponent } from './app.component';
import { scoreboardReducer } from './reducers/scoreboard.reducer';

bootstrapApplication(AppComponent, {
  providers: [
    provideStore(),
    provideState({ name: 'game', reducer: scoreboardReducer })
  ],
});
```

## Селекторы

Чистые функции для получения слайсов хранилища.

```tsx
import { createSelector } from '@ngrx/store';

export interface User {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  userId: number;
  name: string;
}

export interface AppState {
  selectedUser: User;
  allBooks: Book[];
}

export const selectUser = (state: AppState) => state.selectedUser;
export const selectAllBooks = (state: AppState) => state.allBooks;

export const selectVisibleBooks = createSelector(
  selectUser,
  selectAllBooks,
  (selectedUser: User, allBooks: Book[]) => {
    if (selectedUser && allBooks) {
      return allBooks.filter((book: Book) => book.userId === selectedUser.id);
    } else {
      return allBooks;
    }
  }
);
```

Значения мемоизируются, и для явного сброса на изначальный `null` нужен метод селектора `release()`.
```tsx
import { createSelector } from '@ngrx/store';

export interface State {
  counter1: number;
  counter2: number;
}

export const selectCounter1 = (state: State) => state.counter1;
export const selectCounter2 = (state: State) => state.counter2;
export const selectTotal = createSelector(
  selectCounter1,
  selectCounter2,
  (counter1, counter2) => counter1 + counter2
); // selectTotal has a memoized value of null, because it has not yet been invoked.

let state = { counter1: 3, counter2: 4 };

selectTotal(state); // computes the sum of 3 & 4, returning 7. selectTotal now has a memoized value of 7
selectTotal(state); // does not compute the sum of 3 & 4. selectTotal instead returns the memoized value of 7

state = { ...state, counter2: 5 };

selectTotal(state); // computes the sum of 3 & 5, returning 8. selectTotal now has a memoized value of 8
```

### selectSignal

Возвращает сигнал вместо Observable

