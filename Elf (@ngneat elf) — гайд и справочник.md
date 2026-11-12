# Elf (@ngneat/elf) — гайд и справочник

Oct 17, 2026 · @Allen

## Что это и как поставить

Elf — реактивный иммутабельный стейт-менеджер на RxJS от ngneat (авторы Akita). Состояние читается через RxJS-операторы, меняется чистыми функциями-мутаторами. Модульный: ядро плюс отдельные пакеты под сущности, запросы, персист, историю, пагинацию и devtools. Фреймворк-агностичен, но чаще всего используется с Angular.

Состояние проекта на октябрь 2026: последние релизы пакетов вышли в августе 2024, CLI обновлялся в июле 2025. Библиотека стабильна, но активной разработки нет — учитывайте это при выборе для нового проекта.

| Пакет | Версия | Зачем |
| --- | --- | --- |
| `@ngneat/elf` | 2.5.1 | Ядро: стор, пропсы, `select`, мутаторы, реестр. Peer: `rxjs >= 7` |
| `@ngneat/elf-entities` | 5.0.2 | Коллекции сущностей (CRUD, селекторы, active, UI-сущности) |
| `@ngneat/elf-requests` | 1.9.2 | Статус запросов (idle/pending/success/error) и кэш |
| `@ngneat/elf-persist-state` | 1.2.1 | Сохранение стора в localStorage/sessionStorage/IndexedDB |
| `@ngneat/elf-state-history` | 1.4.0 | Undo/redo |
| `@ngneat/elf-pagination` | 1.1.0 | Хранение страниц и метаданных пагинации |
| `@ngneat/elf-devtools` | 1.3.0 | Redux DevTools |
| `@ngneat/effects`, `@ngneat/effects-ng` | 2.1.2, 3.1.4 | Экшены и эффекты (опционально), Angular-обвязка (Angular >= 15) |
| `@ngneat/elf-ng-router-store` | 1.0.9 | Состояние Angular Router как стор |
| `@ngneat/elf-cli`, `@ngneat/elf-cli-ng` | 3.1.1, 1.0.0 | Генератор репозиториев; плагин добавляет `@Injectable` |

### Установка

```bash
# интерактивно выбрать пакеты
npx @ngneat/elf-cli install

# или вручную
npm i @ngneat/elf @ngneat/elf-entities @ngneat/elf-requests
npm i -D @ngneat/elf-devtools
```

### CLI: генерация репозитория

```bash
npx @ngneat/elf-cli repo            # спросит имя стора и нужные фичи
npx @ngneat/elf-cli repo --dry-run  # показать, что будет сгенерировано
```

Настройки CLI для Angular — в `package.json`:

```json
{
  "elf": {
    "cli": {
      "repoTemplate": "class",
      "inlineStoreInClass": false,
      "idKey": "id",
      "repoLibrary": "src/app/state",
      "plugins": ["@ngneat/elf-cli-ng"]
    }
  }
}
```

- `repoTemplate: "class"` — репозиторий как класс (по умолчанию экспортируемые функции).
- `inlineStoreInClass: true | "withoutConstructor"` — стор создаётся внутри класса (удобно для компонентных сторов и начального значения из DI).
- `idKey` — глобальный ключ id для сущностей.
- `repoLibrary` — папка, куда класть репозитории.
- `@ngneat/elf-cli-ng` — вешает `@Injectable({ providedIn: 'root' })` на класс.

## Ядро: стор, чтение, запись

Стор — это `BehaviorSubject` состояния. Его собирают из «фич» (`withProps`, `withEntities`, `withRequestsStatus`…), читают через `pipe(select(...))`, меняют только через `store.update(...мутаторы)`. Мутатор — чистая функция `(state, ctx) => newState`.

### Создание стора

```ts
import { createStore, withProps, select, setProp, setProps } from '@ngneat/elf';

interface AuthProps {
  user: { id: number; name: string } | null;
  token: string | null;
  theme: 'light' | 'dark';
}

export const authStore = createStore(
  { name: 'auth' },                       // имя уникально — по нему стор в реестре и devtools
  withProps<AuthProps>({ user: null, token: null, theme: 'light' })
);
```

Несколько фич комбинируются в одном вызове: `createStore({ name: 'todos' }, withProps<P>(...), withEntities<Todo>(), withRequestsStatus())`.

### Чтение

```ts
export const user$  = authStore.pipe(select((s) => s.user));
export const isLoggedIn$ = authStore.pipe(select((s) => !!s.token));

// синхронно
const token = authStore.getValue().token;
const theme = authStore.query((s) => s.theme);

// несколько потоков → один объект, эмит один раз за update
const vm$ = authStore.combine({ user: user$, loggedIn: isLoggedIn$ });
```

`select` = `map` + `distinctUntilChanged`: эмитит только при изменении ссылки на результат. Поэтому не создавайте новые объекты/массивы в селекторе без нужды — или добавляйте `distinctUntilArrayItemChanged()` / свой компаратор.

### Запись

```ts
authStore.update(setProp('theme', 'dark'));
authStore.update(setProp('theme', (t) => (t === 'dark' ? 'light' : 'dark')));
authStore.update(setProps({ user, token }));
authStore.update(setProps((s) => ({ user: { ...s.user!, name: 'New' } })));

// свой мутатор — просто функция
authStore.update((state) => ({ ...state, token: null, user: null }));

// несколько мутаторов → одно изменение, один эмит
authStore.update(setProp('token', t), setProp('user', u));

authStore.reset();   // к initialState
authStore.destroy(); // убрать из реестра (компонентные сторы)
```

Состояние иммутабельно по соглашению: всегда возвращайте новый объект. Elf не замораживает стейт сам — для отлова мутаций в dev подключите `deepFreeze` через хук (ниже).

### Store API

| Член | Что делает |
| --- | --- |
| `pipe(select(fn))` | Поток части состояния |
| `getValue()` / `query(fn)` | Синхронное чтение |
| `update(...reducers)` | Применить мутаторы, один эмит |
| `reset()` | Вернуть `initialState` |
| `combine({ a$, b$ })` | Объединить потоки в объект |
| `name`, `initialState`, `events$` | Имя, начальное состояние, поток событий стора |
| `destroy()` | Удалить стор из реестра |

### Операторы ядра

| Оператор | Назначение |
| --- | --- |
| `select(fn)` | Выборка с `distinctUntilChanged` |
| `filterNil()` | Отбросить `null`/`undefined`, сузить тип |
| `head()` | Первый элемент массива |
| `distinctUntilArrayItemChanged()` | Эмит, только если поменялись элементы массива (а не ссылка) |
| `asap()` | Отложить эмит в микротаск (полезно при синхронных циклах) |

### Батчинг

```ts
import { emitOnce, emitOnceAsync } from '@ngneat/elf';

emitOnce(() => {          // изменения в нескольких сторах → подписчики получат один эмит
  todosStore.update(setEntities(todos));
  uiStore.update(setProp('loading', false));
});

await emitOnceAsync(async () => { /* то же для async */ });
```

### Своя фича: propsFactory

Генерирует набор функций под одно свойство — удобно для переиспользуемых кусков стейта.

```ts
import { propsFactory, propsArrayFactory } from '@ngneat/elf';

export const { withFilter, selectFilter, setFilter, updateFilter, resetFilter, getFilter } =
  propsFactory('filter', { initialValue: { q: '', status: 'ALL' } });

export const { withIds, selectIds, addIds, removeIds, toggleIds, inIds } =
  propsArrayFactory('ids', { initialValue: [] as number[] });

const store = createStore({ name: 'search' }, withFilter(), withIds());
store.update(updateFilter({ q: 'elf' }), toggleIds(5));
```

### Реестр, хуки, прод-режим

```ts
import { getStore, getRegistry, getStoresSnapshot, registry$, elfHooks, deepFreeze,
         enableElfProdMode, isDev } from '@ngneat/elf';

getStore('auth');          // стор по имени
getStoresSnapshot();       // { auth: {...}, todos: {...} } — удобно для логов/SSR
registry$.subscribe(({ type, store }) => {});  // 'add' | 'remove'

// заморозка стейта в dev
if (isDev()) {
  elfHooks.registerPreStoreUpdate((_curr, next) => deepFreeze(next));
}

// в main.ts для продакшена — отключает dev-проверки
if (environment.production) enableElfProdMode();
```

`registerPreStateInit((initial, storeName) => newInitial)` позволяет подменить начальное состояние любого стора (например, для гидрации SSR). Хук обязан вернуть значение.

## Entities: коллекции

`withEntities<T>()` хранит коллекцию нормализованно: `entities: Record<id, T>` + `ids: id[]` (порядок). Все функции пакета — это либо операторы для `pipe` (`select*`), либо мутаторы для `update`, либо синхронные запросы для `store.query(get*)`.

```ts
import { createStore } from '@ngneat/elf';
import {
  withEntities, withActiveId, selectAllEntities, selectEntity, selectActiveEntity,
  setEntities, addEntities, updateEntities, upsertEntities, deleteEntities, setActiveId,
  getEntity, hasEntity,
} from '@ngneat/elf-entities';

interface Todo { id: number; title: string; done: boolean }

const todosStore = createStore(
  { name: 'todos' },
  withEntities<Todo>(),        // idKey по умолчанию 'id'; иначе withEntities<User, '_id'>({ idKey: '_id' })
  withActiveId()
);

export const todos$  = todosStore.pipe(selectAllEntities());
export const active$ = todosStore.pipe(selectActiveEntity());
export const todo$ = (id: number) => todosStore.pipe(selectEntity(id));
export const title$ = (id: number) => todosStore.pipe(selectEntity(id, { pluck: 'title' }));

todosStore.update(setEntities(todosFromApi));                       // заменить всё
todosStore.update(addEntities({ id: 4, title: 'x', done: false }, { prepend: true }));
todosStore.update(updateEntities(4, { done: true }));               // patch
todosStore.update(updateEntities([1, 2], (t) => ({ ...t, done: !t.done })));
todosStore.update(upsertEntities([{ id: 4, title: 'y' }, newTodo])); // merge или add
todosStore.update(deleteEntities(4), setActiveId(1));

const t = todosStore.query(getEntity(1));
const exists = todosStore.query(hasEntity(1));
```

### Селекторы (pipe)

| Функция | Возвращает |
| --- | --- |
| `selectAllEntities()` | `T[]` в порядке `ids` |
| `selectEntities()` | `Record<id, T>` |
| `selectAllEntitiesApply({ filterEntity, mapEntity })` | Отфильтрованный/преобразованный массив |
| `selectEntity(id, { pluck? })` | `T \| undefined` или поле |
| `selectEntityByPredicate(fn)` | Первая подходящая сущность |
| `selectMany(ids)`, `selectManyByPredicate(fn)` | Массив по id/условию |
| `selectFirst()`, `selectLast()` | Первая/последняя |
| `selectEntitiesCount()`, `selectEntitiesCountByPredicate(fn)` | Число |
| `selectActiveId()`, `selectActiveEntity()` | Активный (нужен `withActiveId()`) |
| `selectActiveIds()`, `selectActiveEntities()` | Несколько активных (нужен `withActiveIds()`) |

### Мутаторы (update)

| Функция | Действие |
| --- | --- |
| `setEntities(arr)`, `setEntitiesMap(rec)` | Полная замена |
| `addEntities(x \| arr, { prepend? })` | Добавить (id должен быть новым) |
| `addEntitiesFifo(arr, { limit })` | Добавить, вытесняя старые сверх лимита |
| `updateEntities(id \| ids, patch \| fn)` | Обновить существующие |
| `updateEntitiesByPredicate(fn, patch)`, `updateAllEntities(patch)` | Обновить по условию / все |
| `upsertEntities(x \| arr)` | Слить с существующими или добавить |
| `upsertEntitiesById(ids, { updater, creator, mergeUpdaterWithCreator? })` | Upsert с фабрикой для новых |
| `updateEntitiesIds(oldId, newId)` | Сменить id (например, temp → серверный) |
| `deleteEntities(id \| ids)`, `deleteEntitiesByPredicate(fn)`, `deleteAllEntities()` | Удаление |
| `moveEntity({ fromIndex, toIndex })` | Переставить в `ids` (drag-n-drop) |
| `setActiveId(id)`, `resetActiveId()` | Активная сущность |
| `setActiveIds`, `addActiveIds`, `removeActiveIds`, `toggleActiveIds`, `resetActiveIds` | Множественный выбор |

### Синхронные запросы (store.query)

`getAllEntities()`, `getAllEntitiesApply({...})`, `getEntity(id)`, `getEntityByPredicate(fn)`, `hasEntity(id)`, `getEntitiesIds()`, `getEntitiesCount()`, `getEntitiesCountByPredicate(fn)`, `getActiveId`, `getActiveEntity()`, `getActiveIds`, `getActiveEntities()`.

### Несколько коллекций в одном сторе

```ts
import { entitiesPropsFactory } from '@ngneat/elf-entities';

const { cartEntitiesRef, withCartEntities } = entitiesPropsFactory('cart');

const store = createStore({ name: 'shop' }, withEntities<Product>(), withCartEntities<CartItem>());

store.pipe(selectAllEntities({ ref: cartEntitiesRef }));
store.update(addEntities(item, { ref: cartEntitiesRef }));
```

Каждая функция пакета принимает `{ ref }` — так она понимает, с какой коллекцией работать.

### UI-сущности

UI-состояние (раскрыт, редактируется, выделен) держат отдельно от серверных данных и склеивают при чтении:

```ts
import { withUIEntities, UIEntitiesRef, unionEntities } from '@ngneat/elf-entities';

interface TodoUI { id: number; open: boolean }

const store = createStore({ name: 'todos' }, withEntities<Todo>(), withUIEntities<TodoUI>());

store.update(
  setEntities(todos),
  setEntities(todos.map(({ id }) => ({ id, open: false })), { ref: UIEntitiesRef })
);

const withUi$ = store.combine({
  entities: store.pipe(selectAllEntities()),
  UIEntities: store.pipe(selectEntities({ ref: UIEntitiesRef })),
}).pipe(unionEntities());   // (Todo & TodoUI)[]
```

## Requests: статус загрузки и кэш

`@ngneat/elf-requests` хранит статус каждого запроса по ключу и умеет не повторять уже закэшированные запросы. Главная ловушка: `trackRequestStatus` ставит `pending` и `error` автоматически, а `success` — нет: его выставляете вы в том же `update`, где кладёте данные.

```ts
import { createStore } from '@ngneat/elf';
import { withEntities, setEntities, upsertEntities, selectAllEntities } from '@ngneat/elf-entities';
import {
  withRequestsStatus, withRequestsCache, createRequestsStatusOperator, createRequestsCacheOperator,
  updateRequestStatus, updateRequestCache, selectRequestStatus, selectIsRequestPending,
} from '@ngneat/elf-requests';

const todosStore = createStore(
  { name: 'todos' },
  withEntities<Todo>(),
  withRequestsStatus<'todos' | `todo-${number}`>(),
  withRequestsCache<'todos'>()
);

const trackRequestsStatus = createRequestsStatusOperator(todosStore);
const skipWhileTodosCached = createRequestsCacheOperator(todosStore);

export function fetchTodos() {
  return http.get<Todo[]>('/api/todos').pipe(
    tap((todos) =>
      todosStore.update(
        setEntities(todos),
        updateRequestStatus('todos', 'success'),
        updateRequestCache('todos', { ttl: 60_000 })   // без ttl — навсегда
      )
    ),
    trackRequestsStatus('todos', { mapError: (e) => e.message }),
    skipWhileTodosCached('todos')       // если закэшировано — EMPTY, HTTP не уходит
  );
}

export const status$  = todosStore.pipe(selectRequestStatus('todos'));    // { value: 'idle'|'pending'|'success'|'error', error? }
export const loading$ = todosStore.pipe(selectIsRequestPending('todos'));
```

Порядок операторов важен: `skipWhileCached` — последним, чтобы при попадании в кэш не выставился `pending`.

### Статус запросов

| Функция | Тип | Назначение |
| --- | --- | --- |
| `withRequestsStatus<Keys>(init?)` | фича | Стейт `requestsStatus: Record<key, StatusState>` |
| `initializeAsPending('todos')` | хелпер | Начальное значение: сразу `pending` (без мигания пустого экрана) |
| `trackRequestStatus(store, key, { mapError })` / `createRequestsStatusOperator(store)` | оператор | `pending` при подписке, `error` при ошибке |
| `updateRequestStatus(key, 'success' \| 'pending' \| 'idle')`, `updateRequestStatus(key, 'error', err)` | мутатор | Ручная установка |
| `updateRequestsStatus([keys], value)` / `updateRequestsStatus({ k: state })` | мутатор | Пакетно |
| `selectRequestStatus(key, { groupKey? })`, `selectIsRequestPending(key)` | селектор | Поток статуса |
| `getRequestStatus(key)` | query | Синхронно |
| `clearRequestsStatus()` | мутатор | Сбросить всё |

### Кэш

| Функция | Назначение |
| --- | --- |
| `withRequestsCache<Keys>(init?)` | Стейт `requestsCache: Record<key, { value: 'none'\|'partial'\|'full', timestamp? }>` |
| `updateRequestCache(key, { ttl?, value? })` | Пометить закэшированным (по умолчанию `full`) |
| `updateRequestsCache([keys], { value, ttl? })` | Пакетно |
| `skipWhileCached(store, key, { value?, returnSource? })` / `createRequestsCacheOperator(store)` | Пропустить запрос, если в кэше; `returnSource` — что вернуть вместо `EMPTY` |
| `selectIsRequestCached(key)`, `isRequestCached(key)`, `selectRequestCache(key)`, `getRequestCache(key)` | Проверка |
| `clearRequestsCache()` | Инвалидировать всё (например, при логауте) |

`value: 'partial'` — для случая, когда загружена одна сущность, а не весь список: `skipWhileCached(key, { value: 'full' })` тогда всё равно сходит в сеть.

### Data source: статус + данные одним потоком

```ts
import { createRequestDataSource } from '@ngneat/elf-requests';

const todosDS = createRequestDataSource({
  store: todosStore,
  data$: () => todosStore.pipe(selectAllEntities()),
  requestKey: 'todos',
  dataKey: 'todos',
  idleAsPending: true,
});

http.get<Todo[]>('/api/todos').pipe(
  tap((todos) => todosStore.update(setEntities(todos), todosDS.setSuccess(), todosDS.setCached())),
  todosDS.trackRequestStatus(),
  todosDS.skipWhileCached()
);

todosDS.data$();  // Observable<{ loading: boolean; error: unknown; todos: Todo[] }>
```

Без `requestKey` получится data source с динамическим ключом: все методы принимают `{ key }`, а `data$` — `(key) => Observable`.

### Request result (стиль React Query, без стора)

Глобальный трекер результатов по ключу-массиву — для запросов, которые не нужно класть в стор.

```ts
import { trackRequestResult, joinRequestResult, filterSuccess } from '@ngneat/elf-requests';

getTodos() {
  return http.get<Todo[]>('/api/todos').pipe(
    trackRequestResult(['todos'], { staleTime: 30_000, preventConcurrentRequest: true })
  );
}

// где-то в UI
todos$.pipe(joinRequestResult(['todos']));   // { isLoading, isSuccess, isError, status, error, data }
```

Опции `trackRequestResult`: `staleTime`, `skipCache`, `preventConcurrentRequest`, `cacheResponseData`, `additionalKeys`. Вспомогательные: `getRequestResult`, `deleteRequestResult`, `resetStaleTime`, `clearRequestsResult`, `filterSuccess`, `filterError`, `mapResultData`.

## Persist, история, пагинация, devtools

### Persist state

Сохраняет стор в хранилище и восстанавливает при старте. Вызывать сразу после `createStore`.

```ts
import { persistState, localStorageStrategy, sessionStorageStrategy, excludeKeys } from '@ngneat/elf-persist-state';

export const authPersist = persistState(authStore, {
  key: 'auth',                                  // ключ в storage; по умолчанию `${storeName}@store`
  storage: localStorageStrategy,
  source: (store) => store.pipe(excludeKeys(['theme'])),  // что сохранять
  preStoreInit: (saved) => ({ ...saved, token: saved.token ?? null }),  // миграция при чтении
  preStorageUpdate: (_name, state) => state,     // трансформация перед записью
  runGuard: () => typeof window !== 'undefined', // SSR: не трогать storage на сервере
});

// дождаться гидрации (особенно для async-хранилищ)
authPersist.initialized$.pipe(filter(Boolean), take(1)).subscribe(() => bootstrapAuth());
```

- Любой объект с `getItem/setItem/removeItem` (Promise или Observable) подходит как `storage`. IndexedDB: `storage: localForage` (пакет `localforage`).
- Сохранять только часть стейта для entities: `source: (s) => s.pipe(select(({ entities, ids }) => ({ entities, ids })))`.
- `authPersist.unsubscribe()` — остановить сохранение.

### State history (undo/redo)

```ts
import { stateHistory, entitiesStateHistory } from '@ngneat/elf-state-history';

export const editorHistory = stateHistory(editorStore, {
  maxAge: 20,                                    // глубина истории
  comparatorFn: (prev, curr) => prev.text !== curr.text,   // что считать новым шагом
  resetFutureOnNewState: true,
});

editorHistory.undo(); editorHistory.redo();
editorHistory.hasPast$;   // для [disabled] кнопки
editorHistory.jump(-3); editorHistory.jumpToPast(0);
editorHistory.pause(); /* изменения без истории */ editorHistory.resume();
editorHistory.clear(); editorHistory.destroy({ clearHistory: true });

// история по отдельным сущностям
const todosHistory = entitiesStateHistory(todosStore, { maxAge: 10, entityIds: [1, 2] });
todosHistory.undo(1); todosHistory.hasPast(1);
```

### Pagination

Хранит id сущностей по страницам и мету (`total`, `perPage`, `lastPage`, `currentPage`). Работает поверх `withEntities`.

```ts
import { withPagination, setPage, updatePaginationData, setCurrentPage, selectCurrentPageEntities,
         selectPaginationData, skipWhilePageExists, deleteAllPages } from '@ngneat/elf-pagination';

const usersStore = createStore({ name: 'users' }, withEntities<User>(), withPagination());

function loadPage(page: number) {
  return http.get<{ data: User[]; total: number; perPage: number; lastPage: number }>(`/api/users?page=${page}`).pipe(
    tap((res) => usersStore.update(
      upsertEntities(res.data),
      updatePaginationData({ total: res.total, perPage: res.perPage, lastPage: res.lastPage, currentPage: page }),
      setPage(page, res.data.map((u) => u.id))
    )),
    skipWhilePageExists(usersStore, page)       // уже есть → не грузить
  );
}

usersStore.update(setCurrentPage(2));           // переключиться на загруженную страницу
export const pageUsers$ = usersStore.pipe(selectCurrentPageEntities());
export const meta$ = usersStore.pipe(selectPaginationData());

// при смене фильтра/сортировки
usersStore.update(deleteAllPages());
```

Ещё: `selectCurrentPage()`, `selectHasPage(n)`, `hasPage(n)`, `getPaginationData()`, `deletePage(n)`, `withPagination({ initialPage })`.

### Devtools

Связывает все сторы с расширением Redux DevTools: дерево стейта, таймлайн, time-travel.

```ts
import { devTools } from '@ngneat/elf-devtools';

if (isDevMode()) {
  devTools({
    name: 'My App',
    maxAge: 50,
    logTrace: false,
    postTimelineUpdate: () => appRef.tick(),   // Angular: перерисовать после time-travel
    actionsDispatcher: actions,                // поток экшенов @ngneat/effects — видны в таймлайне
  });
}
```

`send({ type: 'custom' })` отправит произвольное событие в таймлайн. Где вызвать `devTools` в Angular — в разделе ниже.

## Angular: как это собрать

Стандартная схема: стор + `@Injectable` репозиторий (чтение и мутаторы) + сервис для HTTP (или эффекты). Компоненты читают потоки репозитория через `async` или `toSignal` и вызывают его методы. Нативных сигналов в Elf нет — мост через `@angular/core/rxjs-interop`.

### Репозиторий

```ts
// todos.repository.ts
import { Injectable } from '@angular/core';
import { createStore, withProps, select, setProp } from '@ngneat/elf';
import { withEntities, selectAllEntities, setEntities, addEntities, updateEntities,
         deleteEntities, selectAllEntitiesApply } from '@ngneat/elf-entities';
import { withRequestsStatus, selectIsRequestPending, updateRequestStatus } from '@ngneat/elf-requests';
import { combineLatest, map } from 'rxjs';

export interface Todo { id: number; title: string; done: boolean }
type Filter = 'ALL' | 'ACTIVE' | 'DONE';

const store = createStore(
  { name: 'todos' },
  withProps<{ filter: Filter }>({ filter: 'ALL' }),
  withEntities<Todo>(),
  withRequestsStatus<'todos'>()
);

@Injectable({ providedIn: 'root' })
export class TodosRepository {
  filter$  = store.pipe(select((s) => s.filter));
  todos$   = store.pipe(selectAllEntities());
  loading$ = store.pipe(selectIsRequestPending('todos'));

  visible$ = combineLatest([this.filter$, this.todos$]).pipe(
    map(([f, todos]) => todos.filter((t) => f === 'ALL' || (f === 'DONE') === t.done))
  );

  setTodos(todos: Todo[]) { store.update(setEntities(todos), updateRequestStatus('todos', 'success')); }
  add(todo: Todo)         { store.update(addEntities(todo)); }
  toggle(id: number)      { store.update(updateEntities(id, (t) => ({ ...t, done: !t.done }))); }
  remove(id: number)      { store.update(deleteEntities(id)); }
  setFilter(f: Filter)    { store.update(setProp('filter', f)); }
}
```

```ts
// todos.service.ts — HTTP + синхронизация со стором
@Injectable({ providedIn: 'root' })
export class TodosService {
  private http = inject(HttpClient);
  private repo = inject(TodosRepository);

  load() {
    return this.http.get<Todo[]>('/api/todos').pipe(
      tap((todos) => this.repo.setTodos(todos)),
      trackRequestsStatus('todos')    // createRequestsStatusOperator(store), экспортируйте из файла репозитория
    );
  }
}
```

### Компонент: async pipe или signals

```ts
@Component({
  selector: 'app-todos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  template: `
    @if (loading()) { <p>Загрузка…</p> }
    @for (t of todos(); track t.id) {
      <label><input type="checkbox" [checked]="t.done" (change)="repo.toggle(t.id)"> {{ t.title }}</label>
    }
    <!-- вариант без сигналов: @for (t of repo.visible$ | async; track t.id) -->
  `,
})
export class TodosComponent {
  repo = inject(TodosRepository);
  private service = inject(TodosService);

  todos   = toSignal(this.repo.visible$, { initialValue: [] });
  loading = toSignal(this.repo.loading$, { initialValue: false });

  constructor() {
    this.service.load().pipe(takeUntilDestroyed()).subscribe();
  }
}
```

Сторы — `BehaviorSubject`, поэтому `toSignal(store.pipe(...), { requireSync: true })` тоже работает без `initialValue`.

### Подключение в app.config.ts

```ts
import { ApplicationConfig, APP_INITIALIZER, ApplicationRef, isDevMode, importProvidersFrom } from '@angular/core';
import { devTools } from '@ngneat/elf-devtools';
import { provideEffectsManager, provideEffects, Actions } from '@ngneat/effects-ng';
import { ElfNgRouterStoreModule } from '@ngneat/elf-ng-router-store';

export function initElfDevTools(actions: Actions, appRef: ApplicationRef) {
  return () => {
    if (isDevMode()) devTools({ name: 'My App', postTimelineUpdate: () => appRef.tick(), actionsDispatcher: actions });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    provideEffectsManager(),               // { dispatchByDefault: true } — если эффекты должны диспатчить результат
    provideEffects(TodosEffects),
    importProvidersFrom(ElfNgRouterStoreModule),
    { provide: APP_INITIALIZER, multi: true, useFactory: initElfDevTools, deps: [Actions, ApplicationRef] },
  ],
};
```

В `main.ts` для прода: `if (!isDevMode()) enableElfProdMode();`.

### Компонентный (локальный) стор

Когда стейт живёт ровно столько, сколько компонент: стор создаётся в репозитории, репозиторий — в `providers` компонента, в `ngOnDestroy` стор уничтожается. Имя должно быть уникальным для каждого экземпляра.

```ts
let uid = 0;

@Injectable()
export class FormRepository implements OnDestroy {
  private store = createStore({ name: `form-${uid++}` }, withProps<{ dirty: boolean }>({ dirty: false }));
  dirty$ = this.store.pipe(select((s) => s.dirty));
  markDirty() { this.store.update(setProp('dirty', true)); }
  ngOnDestroy() { this.store.destroy(); }
}

@Component({ providers: [FormRepository], /* … */ })
export class FormComponent { repo = inject(FormRepository); }
```

### Эффекты (@ngneat/effects-ng)

Опционально — если нужен Redux-подобный поток «экшен → эффект». Для большинства задач хватает методов сервиса.

```ts
// todos.actions.ts
import { actionsFactory, props } from '@ngneat/effects';
const todoActions = actionsFactory('todos');
export const loadTodos = todoActions.create('Load');
export const addTodo   = todoActions.create('Add', props<{ title: string }>());

// todos.effects.ts
@Injectable({ providedIn: 'root' })
export class TodosEffects {
  private api = inject(TodosApi);
  private repo = inject(TodosRepository);

  loadTodos$ = createEffect((actions) => actions.pipe(
    ofType(loadTodos),
    switchMap(() => this.api.getAll().pipe(
      tapResult((todos) => this.repo.setTodos(todos), (e) => console.error(e))  // эффект не умрёт на ошибке
    ))
  ));
}

// компонент
private actions = inject(Actions);
ngOnInit() { this.actions.dispatch(loadTodos()); }
```

- Ленивые эффекты: `providers: [provideEffects(PostsEffects)]` в описании маршрута.
- Эффекты на время жизни компонента: `provideDirectiveEffects(MyEffects)` в `providers` + `hostDirectives: [EffectsDirective]`.
- Локальный «эффект-функция» без экшенов: `inject(EffectFn).createEffectFn((id$) => id$.pipe(switchMap(...)))` — отписка при уничтожении.

### Router store

`ElfNgRouterStoreModule` синхронизирует Angular Router в стор, `RouterRepository` его читает:

```ts
const router = inject(RouterRepository);
router.selectParams('id');                // Observable<string>
router.selectParams(['id', 'tab']);       // [id, tab]
router.selectQueryParams('page');
router.selectData('title'); router.selectFragment();
router.getParams('id');                   // синхронно
router.selectNavigationError(); router.selectNavigationCancel();
```

## Тесты, ошибки, шпаргалка

### Тестирование

Сторы, созданные на уровне модуля, — синглтоны и живут между тестами. Сбрасывайте их перед каждым тестом.

```ts
import { getRegistry } from '@ngneat/elf';

beforeEach(() => getRegistry().forEach((store) => store.reset()));

it('toggles todo', () => {
  const repo = TestBed.inject(TodosRepository);
  repo.setTodos([{ id: 1, title: 'a', done: false }]);
  repo.toggle(1);

  let result: Todo[] = [];
  repo.todos$.pipe(take(1)).subscribe((t) => (result = t));   // BehaviorSubject эмитит синхронно
  expect(result[0].done).toBe(true);
});
```

Мутаторы — чистые функции, их можно тестировать без стора: `expect(setProp('a', 1)(state, ctx))`.

### Частые ошибки

| Симптом | Причина и решение |
| --- | --- |
| Статус навсегда `pending` | `success` не ставится сам: добавьте `updateRequestStatus(key, 'success')` в `update` с данными |
| Запрос не уходит после логаута | Кэш жив: `store.update(clearRequestsCache())` |
| Селектор эмитит на каждый `update` | В `select` создаётся новый массив/объект; выносите вычисления в `combineLatest` + `distinctUntilArrayItemChanged()` |
| Два стора «перетирают» друг друга в devtools/persist | Одинаковые `name`; у компонентных сторов делайте уникальный суффикс |
| Мутация «не видна» в UI | Объект изменён по месту; всегда возвращайте новый объект (включите `deepFreeze` в dev) |
| После time-travel UI не обновился | В `devTools` нет `postTimelineUpdate: () => appRef.tick()` |
| Стейт из localStorage устарел после смены модели | Мигрируйте в `preStoreInit` или смените `key` |
| Утечка компонентного стора | Нет `store.destroy()` в `ngOnDestroy` |
| Ошибка в эффекте убивает его навсегда | Обрабатывайте ошибки внутри `switchMap` через `tapResult` / `catchError` |

### Рекомендации по структуре

- Один домен — один файл: `todos.repository.ts` (стор + чтение + мутаторы), `todos.service.ts` (HTTP).
- Стор не экспортируйте наружу; публичное API — методы и потоки репозитория.
- Объединяйте несколько мутаторов в один `update(...)` — один эмит, одно событие в devtools.
- Производные данные считайте в репозитории, а не в компоненте.
- Для нескольких сторов одновременно — `emitOnce`.

### Шпаргалка импортов

| Откуда | Что |
| --- | --- |
| `@ngneat/elf` | `createStore`, `withProps`, `select`, `setProp`, `setProps`, `filterNil`, `head`, `distinctUntilArrayItemChanged`, `asap`, `emitOnce`, `emitOnceAsync`, `propsFactory`, `propsArrayFactory`, `getStore`, `getRegistry`, `getStoresSnapshot`, `registry$`, `elfHooks`, `deepFreeze`, `enableElfProdMode`, `isDev` |
| `@ngneat/elf-entities` | `withEntities`, `withUIEntities`, `UIEntitiesRef`, `entitiesPropsFactory`, `withActiveId(s)`, `select*`, `set/add/update/upsert/delete*Entities`, `moveEntity`, `get*`, `hasEntity`, `unionEntities` |
| `@ngneat/elf-requests` | `withRequestsStatus`, `withRequestsCache`, `createRequestsStatusOperator`, `createRequestsCacheOperator`, `updateRequestStatus`, `updateRequestCache`, `selectRequestStatus`, `selectIsRequestPending`, `clearRequestsCache`, `createRequestDataSource`, `trackRequestResult`, `joinRequestResult` |
| `@ngneat/elf-persist-state` | `persistState`, `localStorageStrategy`, `sessionStorageStrategy`, `excludeKeys` |
| `@ngneat/elf-state-history` | `stateHistory`, `entitiesStateHistory` |
| `@ngneat/elf-pagination` | `withPagination`, `setPage`, `updatePaginationData`, `setCurrentPage`, `selectCurrentPageEntities`, `selectPaginationData`, `skipWhilePageExists`, `deleteAllPages` |
| `@ngneat/elf-devtools` | `devTools`, `send` |
| `@ngneat/effects` | `actionsFactory`, `createAction`, `props`, `createEffect`, `ofType`, `tapResult` |
| `@ngneat/effects-ng` | `provideEffectsManager`, `provideEffects`, `Actions`, `EffectFn`, `provideDirectiveEffects`, `EffectsDirective` |
| `@ngneat/elf-ng-router-store` | `ElfNgRouterStoreModule`, `RouterRepository` |

## Источники

API сверено по типам и исходникам опубликованных npm-пакетов (версии в первой таблице).

- [Репозиторий ngneat/elf](https://github.com/ngneat/elf)
- [Документация Elf: CLI](https://ngneat.github.io/elf/docs/cli)
- [@ngneat/elf-ng-router-store на npm](https://npmjs.com/package/@ngneat/elf-ng-router-store)
