Zone.js - библиотека, оборачивающая вызов асинхронных операций для сохранения контекста выполнения на протяжении всего асинхронного стэка. Уже основываясь на этом открываются возможности для отслеживания изменения состояния.

Зона — это «контейнер» для выполнения кода с сохранением контекста, который гарантирует, что асинхронные операции выполняются в правильном окружении.

Зона - это по сути обёртка над базовой API, реализующая коллстек для асинхронки

Зона:
1. Сохранение контекста асинхронного стека событий
2. Возможность получить хуки браузерных событий (поскольку зона по сути оборачивает браузерные методы)
3. Ангуляр понимает когда запускать проверку изменений после асинхронки от зоны
4. Манкипатчинг, переопределение базового API
5. Увеличение задержек.

NgZone оборачивает каждое приложение. Обсерв `onMicrotaskEmpty` испускает события когда в очереди больше нет микротасков. Тогда ангуляр понимает что асинхронки больше нет и можно запустить change detection

```ts
// ng_zone_scheduling.ts NgZoneChangeDetectionScheduler
this._onMicrotaskEmptySubscription = this.zone.onMicrotaskEmpty.subscribe({
    next: () => this.zone.run(() => this.applicationRef.tick())
});
```

`tick()` - метод запуска обнаружения изменений для всего древа компонентов (синхронно)

```ts
tick(): void {
    // code removed for brevity
    for (let view of this._views) {
        // runs the change detection for a single component
        view.detectChanges(); 
    }
}
```

## Оптимизация
```ts
this.ngZone.runOutsideAngular(() => setInterval(pollForUpdates), 500);
```
При помощи этого метода запускаем ненужные асинхронки, которые не меняют состояние модели.
- `requestAnimationFrame`, `setTimeout` or `setInterval`
- Task or microtask scheduling by third-party libraries

```ts
console.log(NgZone.isInAngularZone());
```
проверка находимся ли в зоне

```ts
  
this.ngZone.run(() => {21 this.plotlyClick.emit(event);22 });
```
через `run` указываем явно, что прогонять через зону
# Грязюка

Случаи, при которых ангуляр вызывает `markViewDirty()` для пометки компонента как требующего обновления
- Срабатывание события, будь то связка событий, аутпута или хостлистенера (обёртка помечает грязным)
- Изменение инпута, получение новых значений через связку с шаблоном (через строгое сравнение)

Помечается текущий компонент и всех его предков.

**пометка грязным никак не влияет на базовое обнаружение изменений, поскольку дефолтная стратегия проверяет все дерево целиком без исключений. грязюка необходима для оптимизации через OnPush**

Сценарий
1. Нажатие на кнопку
2. пометка грязным до топа
3. уведомление о клике зоны
4. выполнение асинк микротасков
5. Тик (чендж детекшен)

Проверка идет сверху-вниз
- OnPush + Non-Dirty -> Skip
- OnPush + Dirty -> Check bindings -> Refresh bindings -> Check children

```ts
markForCheck(): void {
    markViewDirty(this._cdRefInjectingView || this._lView, NotificationSource.MarkForCheck);
  }
```


MarkForCheck просто вызывает markViewDirty. То есть использовать нужно первое. Мы сами не должны помечать объект как грязный, мы должны лишь сказать, что его нужно проверить.
# Zoneless
Причины:
1. Производительность (не запускаются проверки на изменение при событиях или асинках)
2. Меньший бандл и быстрее стартап
3. Упрощение дебага (из-за отсутствия магии и явного стектрейса)
4. Лучшая совместимость (отсутствие манкипатчинга)

Отключение
```ts
// standalone bootstrap
bootstrapApplication(MyApp, {providers: [
  provideZonelessChangeDetection(),
]});
// NgModule bootstrap
platformBrowser().bootstrapModule(AppModule);
@NgModule({
  providers: [provideZonelessChangeDetection()]
})
export class AppModule {}
```
Или же указать при создании `ng new --zoneless`

Zoneless applications should remove ZoneJS entirely from the build to reduce bundle size. ZoneJS is typically loaded via the `polyfills` option in `angular.json`, both in the `build` and `test` targets. Remove `zone.js` and `zone.js/testing` from both to remove it from the build. Projects which use an explicit `polyfills.ts` file should remove `import 'zone.js';` and `import 'zone.js/testing';` from the file.

After removing ZoneJS from the build, there is no longer a need for a `zone.js` dependency either and the package can be removed entirely:

Причиной отказа от зоны послужило появление новых инструментов реактивности (сигналы, rxjs) и changedetection.onpush. То есть теперь есть возможность более точечно указывать когда требуется обновление, потому можно сэкономить

Нужно убрать при zoneless подходе из кода
[`NgZone.onMicrotaskEmpty`](https://angular.dev/api/core/NgZone#onMicrotaskEmpty), [`NgZone.onUnstable`](https://angular.dev/api/core/NgZone#onUnstable)  [`NgZone.onStable`](https://angular.dev/api/core/NgZone#onStable).[`NgZone.isStable`](https://angular.dev/api/core/NgZone#isStable)

`run` и `runOutsideAngular` убирать не нужно

