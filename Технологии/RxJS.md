# Functions
## Преобразование
#### `of()`
Просто оборачивает каждое переданное значение без его разворачивания (массив - один эмит)
#### `from()`
Преобразует что угодно в obs, правильно разворачивая итерируемые элементы, массивы, промисы и тд.
## Слияние
`merge()`
Просто пробрасывает все эмиты.
```ts
merge(...args: (number | SchedulerLike | ObservableInput<unknown>)[]): Observable<unknown>
```
# idk
### `connectable`
```ts
connectable<T>(source: ObservableInput<T>, config: ConnectableConfig<T> = DEFAULT_CONFIG): Connectable<T>
```

# Observable
## Преобразование
```ts
type ObservableInput<T> = Observable<T> | InteropObservable<T> | AsyncIterable<T> | PromiseLike<T> | ArrayLike<T> | Iterable<T> | ReadableStreamLike<T>;
```
Определяет типы, которые можно преобразовать к obs

# Observer

# Operators
## Теория
Оператор - чистая функция.
Фабрика Оператора - задает контекст и возвращает оператор, аргументы принадлежат к лексической ОВ оператора.
Разделение на **пайпируемые** и **создающие**
## Pipable
### Scheduling
#### `observeOn()`
```ts
observeOn<T>(scheduler: SchedulerLike, delay: number = 0): MonoTypeOperatorFunction<T>
```
## Creating

# Subjects

# Scheduler
Сущность, состоящая из трех компонентов:
1. Структура данных - хранение и упорядочивание выполнения тасков (приоритет или)
2. Контекст выполнения (мгновенно, колбек, `animationFrame`)
3. Виртуальное время - метод `now()` 

Без явного указания подбирается наиболее подходящий sch на основе данных.
## Сущности
`asapScheduler` - deferring.
`asyncScheduler` - асинхронки.
`queueScheduler` - выполнение по очереди.
`animationFrameScheduler` - перед следующей отрисовкой.
## Методы
### `schedule()`
```ts
schedule<T>(work: (this: SchedulerAction<T>, state?: T) => void, delay: number = 0, state?: T): Subscription
```
# Практики
## Flattening
Разворачивание obs высокого порядка в обычный.
### Операторы
#### `concatMap()`
Подписывается на каждый "внутренний" obs, копирует все отданные значения и потом переходит к следующему.
#### `switchMap()`
Подписывается на первый obs, передаёт его значения до тех пор, пока другой obs не выдаст значение. В этом случае он отписывается от первого *навсегда* и слушает следующий.
#### `exhaustMap()`
Идёт по порядку, игнорируя следующие obs и их значения пока не получит `complete.`

