**Сигнал** — реактивное значение, которое уведомляет потребителей о своём изменении.
По сути является *типом*, объединяющим *функцию*, возвращающую дженерик, и *объектом*, содержащим свойство `SIGNAL`

```tsx
type Signal<T> = (() => T) & { 
	[SIGNAL]: unknown;
}
```

Сигнал это *функция*, возвращающее своё текущее значение.

Сигналы создаются при помощи функции `signal()`. Аргументы:
1. Начальное значение
2. Объект настроек сигнала (*CreateSignalOptions*):
	1. `equal` - функция сравнения (по умолчанию `Object.is()`)
	2. `debugName`

Возвращает *WritableSignal*.

```tsx
interface WritableSignal<T> extends Signal<T> { 
	set(value: T): void; 
	update(updateFn: (value: T) => T): void; 
	asReadonly(): Signal<T>; 
	override [SIGNAL]: unknown; 
}
```

*WritableSignal* это расширение *Signal*, добавляет лишь `set()`, `update()`, и `asReadonly()` (не защищает от глубокого преобразования)

Метод `computed()` принимает *анонимную* функцию `computation` и такие же настройки. Возвращает *Signal*.
## CD.OnPush + Signals
Помечает сигнал и его потребителей через присваивание `node.dirty`, что сочетается и работает.

