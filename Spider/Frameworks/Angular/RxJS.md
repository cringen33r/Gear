# Observable
Наблюдаемые объекты - ленивые Push-коллекции нескольких значений. Производители нескольких значений.

---

```tsx
import { Observable } from 'rxjs';

const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});

console.log('just before subscribe');
observable.subscribe({
  next(x) {
    console.log('got value ' + x);
  },
  error(err) {
    console.error('something wrong occurred: ' + err);
  },
  complete() {
    console.log('done');
  },
});
console.log('just after subscribe');
```

Pull и Push протоколы определяют как коммуницируют Потребитель и Производитель данных. Pull - Потребитель определяет, когда получить данные от Производителя, Push - наоборот.

|          | Producer                                   | Consumer                                    |
| -------- | ------------------------------------------ | ------------------------------------------- |
| **Pull** | **Passive:** produces data when requested. | **Active:** decides when data is requested. |
| **Push** | **Active:** produces data at its own pace. | **Passive:** reacts to received data.       |

Pull-система - это функции, которые возвращают значение по запросу Потребителя.
Push-система - это промисы, которые сами пропихивают Потребителю значение.

- *Функция* - ленивое выполнение, одно значение, синхронно.
- *Генератор* - ленивое выполнение, неопределённое кол-во значений, синхронно.
- *Промис* - неопределённое выполнение, одно значение.
- *Обсерв* - ленивое выполнение, синхронно или асинхронно, неопределённое кол-во значений с момента вызова и далее

### Отличие функций от обсервов

Вызов функции означает возврат одного значения синхронно, а подписка на обсерв означает возврат неопределённого количества значений либо синхронно либо асинхронно.


## Основные действия

- Создание
- Подписка
- Исполнение
- Отписка

Создание через 
```tsx
new Observable((subscriber => {
	subscriber.next(5);
	...
}))
```

В основном создаются не через конструктор а через функции создания.

Другим синтаксисом является

```tsx
const observable = new Observable(function subscribe(subscriber){
	subscriber.next(5);
}))
```

В таком случае более очевидно, что при создании переданная функция передаётся в *subscribe*, то есть для каждого обсерва создаётся собственный экземпляр подписки.

В этом коренное отличие от обработчиков событий - подписчики не хранятся ни в каком списке - для каждого из них создаётся собственный обсерв.

При выполнении только три типа возвращаемых - next, error, complete (одноимённые методы используются)

Для отмены подписки используется метод `unsubscribe` объекта *Subscription*, который возвращает метод `observable.subcribe`

```tsx
const subscription = observable.subscribe((x) => console.log(x));
subscription.unsubscribe();
```

Можно явно определить teardown функцию

```tsx
import { Observable } from 'rxjs';

const observable = new Observable(function subscribe(subscriber) {
  // Keep track of the interval resource
  const intervalId = setInterval(() => {
    subscriber.next('hi');
  }, 1000);

  // Provide a way of canceling and disposing the interval resource
  return function unsubscribe() {
    clearInterval(intervalId);
  };
});
```

# Observer

Наблюдатель - потребитель значений от обсерва. Это просто набор обратных вызовов next, error и complete. Можно передать частичные наблюдатели - отсутствующие колбеки будут просто проигнорированы.

Можно передать функцию а не объект, тогда она будет расценена как next

# Operators

Операторы - это функции, которые позволяют определять асинхронную логику в декларативном стиле.

## Виды операторов

### Пайп-операторы

При вызове пайповых операторов они не изменяют обсерв - они создают новый на основе предыдущего, чтобы следующий пайп мог так же его принять.

Пайп-операторы - чистые функции, берущие обсерв на вход и возвращающие обсерв на выход. При этом подписка на обсерв на выходе прокидывается на обсерв, стоящий на входе (иначе цепочка не работает из-за ленивого выполнения).

Фабрика пайп-операторов - функция, возвращающая пайп-оператор с заданными параметрами.

### Операторы создания

Самостоятельные функции, которые создают обсервы на основе входных данных.


## Обсервы высшего порядка

Ситуация когда обсерв возвращает другой обсерв в качестве значения.

```tsx
const fileObservable = urlObservable.pipe(
  map((url) => http.get(url)),
  concatAll()
);
```

В таких случаях вторым параметром в пайп передаётся оператор сплющивания (оператор объединения), которые определяет порядок подписки на вложенные обсервы.


# Подписка

Объект, который хранит выполнение обсерва. Используется только для отписки

Можно объединять несколько подписок в одну через `sub1.add(sub2)`


# Субъекты

Тип обсервов, который позволяет передачу значений нескольким наблюдателям, а не уникаст. В этом смысле схож с логикой прослушивателей, поскольку хранит список потребителей.

Субъект - одновременно *прослушиваемый* и *прослушиваемое*. То есть на него можно подписаться, но при этом ему можно пихнуть значение через `next`, в результате чего он пихнёт значение всем подписанным потребителям.

Субъект, по сути, превращает уникаст в мультикаст.

```tsx
import { Subject } from 'rxjs';

const subject = new Subject<number>();

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`),
});
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`),
});

subject.next(1);
subject.next(2);

// Logs:
// observerA: 1
// observerB: 1
// observerA: 2
// observerB: 2
```

## Виды субъектов

### BehaviourSubject

Хранит последнее значение, переданное потребителям ("текущее" значение). Таким образом, при подключении нового потребителя, он отправляет ему текущее значение, а не ждёт до отсылки следующего.

### ReplaySubject

Может хранить несколько значений. В конструкторе
```tsx
subject = new ReplaySubject(100, 500);
```

Первым параметром передаётся *буфер хранения*, а вторым - *максимальный возраст* значения, которое может быть сохранено.

По умолчанию оба значения равны "бесконечности".

### AsyncSubject

Передаётся лишь *последнее* значение и только тогда, когда заканчивается выполнение (уведомление *complete*)


### Void Subject

Если важно не значение а факт его передачи, то можно указать дженерик `void`, чтобы не передавать значение.

```tsx
subject = new Subject<void>();
subject.next();
```


# Scheduler

Планировщик определяет когда начинается подписка и когда приходят уведомления.

Планировщик это:

1. Структура данных - хранит и упорядочивает задания по критериям
2. Контекст исполнения - определяет где выполняется код (синхронно, в другом коллбеке)
3. Имеет виртуальные часы

```tsx
import { Observable, observeOn, asyncScheduler } from 'rxjs';

const observable = new Observable((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();
}).pipe(
  observeOn(asyncScheduler)
);
```

В примере выше значения выдаются асинхронно.

| Scheduler                   | Purpose                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `null`                      | By not passing any scheduler, notifications are delivered synchronously and recursively. Use this for constant-time operations or tail recursive operations.                   |
| `[queueScheduler]`          | Schedules on a queue in the current event frame (trampoline scheduler). Use this for iteration operations.                                                                     |
| `[asapScheduler]`           | Schedules on the micro task queue, which is the same queue used for promises. Basically after the current job, but before the next job. Use this for asynchronous conversions. |
| `[asyncScheduler]`          | Schedules work with `setInterval`. Use this for time-based operations.                                                                                                         |
| `[animationFrameScheduler]` | Schedules task that will happen just before next browser content repaint. Can be used to create smooth browser animations.                                                     |
