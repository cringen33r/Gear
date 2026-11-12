# Animation

Предоставляет более легковесную функцию `waapi.animate()`, основанную на нативном Web Animation API, которая однако поддерживает меньше функций.

*waapi* связан с `CSS.registerProperty()` для регистрации переменных. Если не поддерживается - то сброс до отсутствия анимации.

Судя по всему, можно указывать сразу конечные значения, anime найдёт текущие сам.

Принимает *targets* и *parameters*

## Targets

1. Селекторы
2. DOM-элементы
3. Object
4. Массив вышеперечисленных

## Parameters

1. Animatable properties,
2. Tween parameters
3. Playback settings
4. Animation callbacks
### Animatable properties

Можно анимировать **БУКВАЛЬНО ВСЁ**

1. **CSS-свойства**
> [!IMPORTANT] Прерывистые анимации
> Стоит избегать анимаций с перерисовкой или с изменением разметки, отдавая приоритет трансформам и прозрачности.

2. **CSS-трансформы**
Лучше всего через *waapi* для прямого изменения

3. **CSS-переменные**
Сначала нужно их определить. Это единственный способ, как JS может повлиять на псевдоэлементы (в случае если они используют переменные)

```tsx
import { animate, utils } from 'animejs';

// Set the CSS variables as properties on the animated elements
utils.set('.square', {
  '--radius': '4px',
  '--x': '0rem',
  '--pseudo-el-after-scale': '1', // applied to the pseudo element "::after"
  borderRadius: 'var(--radius)',
  translateX: 'var(--x)',
});

// Animate the values of the CSS variables
animate('.square', {
  '--radius': '20px',
  '--x': '16.5rem',
  '--pseudo-el-after-scale': '1.55' // Animates the ":after" pseudo element of the element
});
```

4. **JS-свойства объектов**
Если анимируем объект, то можем в параметрах обращаться к его свойствам.

5. **HTML-атрибуты**
6. **SVG-атрибуты**
### Tween value types

1. **Numerical**
Принимает либо строку (с указанием единиц измерения) либо число. Если число, то оно интерпретируется либо как **px**, либо как последняя явно определённое единица измерения (если раньше были проценты, то впредь будут проценты)

2. **Конверсия единиц**
Из-за конверсии значений могут быть непредвиденные результаты, когда anime сам пытается получить текущие значения и сделать переход. Поэтому надёжнее либо явно задать начальные параметры:
```tsx
utils.set('.square', { width: '50%' });
animate('.square', { width: '25%' });

```

либо использовать *waapi*.

3. **Относительные значения**
Поддерживает относительное присваивание (+, -, \*)
```tsx
const add = () => animate($clock, { rotate: '+=90' });
```
4. **Цвета как в css**
5. **Функция color()**
*waapi* позволяет анимировать и это

```tsx
import { waapi } from 'animejs';

waapi.animate('.circle',  {
  backgroundColor: 'color(display-p3 1.0 0.267 0.267 / 1.0)',
});
```

6. **Анимация через переменные**

```tsx
import { waapi, animate } from 'animejs';

waapi.animate('.square',  {
  rotate: 'var(--rotation)',
  borderColor: ['var(--hex-orange)', 'var(--hex-red)' ],
});

// Helper for the JS animate() method
const cssVar = name => $el => utils.get($el, name);

animate('.square',  {
  scale: cssVar('--scale'),
  background: [cssVar('--hex-red'), cssVar('--hex-orange')],
});
```

7. **Функции**

Можно определять изменение значений через функции вида 
(\_, i, l) => {}, где \_ это цель анимации, i - индекс цели, l - общее количество целей.

```tsx
import { animate } from 'animejs';

animate('.square', {
  x: $el => /** @type {HTMLElement} */($el).getAttribute('data-x'),
  y: (_, i) => 50 + (-50 * i),
  scale: (_, i, l) => (l - i) * .75,
  rotate: () => utils.random(-360, 360),
  borderRadius: () => `+=${utils.random(0, 8)}`,
  duration: () => utils.random(1200, 1800),
  delay: () => utils.random(0, 400),
  ease: 'outElastic(1, .5)',
});
```

### Tween parameters

Конфигурация поведения, таймингов и значений анимируемых свойств.

1. Глобальные - определены на уровне *parameters*.
2. Локальные - определены на уровне конкретного параметра (наследуют от глобальных)

```tsx
animate('obj', {
	delay: 100, // global
	x: {
		delay: 200 // local
	}
})
```

*to* и *from* только локальные. Еще есть стандартные для анимаций типа delay, duration, ease.

ТОЛЬКО ДЛЯ JS
**composition** - правила наслаивания анимаций (с индексами элиасами):
	1. **replace** (0) - отмена и замена текущей анимации. По умолчанию если меньше 1с.
	2. **none** (1) - по умолчанию, если длительность больше 1с
	3. **blend** (2) - совмещение. *Невозможно использовать с keyframes и color-анимациями*.

ТОЛЬКО ДЛЯ JS
**modifier** - изменяет конечное значение.

```tsx
import { animate, utils } from 'animejs';

animate('.row:nth-child(1) .square', {
  x: '17rem',
  modifier: utils.round(0), // Round to 0 decimals
  duration: 4000,
});

animate('.row:nth-child(2) .square', {
  x: '85rem',
  modifier: v => v % 17,
  duration: 4000,
});

animate('.row:nth-child(3) .square', {
  x: '17rem',
  y: {
    to: '70rem',
    modifier: v => Math.cos(v) / 2, // Specific modifier to y property
  },
  duration: 4000,
});
```

### Keyframes

1. **Твин значения**
	Массив ключевых кадров (равные промежутки времени)

2. **Твин параметры**
```tsx
y: [ 
	{ to: '-2.5rem', ease: 'out', duration: 400 }, 
	{ to: '2.5rem', duration: 800, delay: 700 }, 
	{ to: 0, ease: 'in', duration: 400, delay: 700 }, 
],
```

3. **Ключевые кадры на основе длительности**
```tsx
keyframes: [
  { y: 50, ease: 'out', duration: 400 },
  { x: 75, scale: .5, duration: 800 },
]
```

4. **Ключевые кадры на основе процентажа**
```tsx
keyframes: {
  '25%' : { x: 100, y: 50, ease: 'out' },
  '50%' : { x: 200, y: 75, },
}
```

### Playback settings

1. delay
2. duration
3. loop (0) - количество повторений. Infinity, -1, true = бесконечно
4. loopDelay - между лупами задержка (JS)
5. alternate (false) - меняется ли направление анимации между лупами
6. reversed
7. autoplay - true, false, onScroll()
8. framerate - (JS)
9. playbackRate - изменение скорости
10. playbackEase - глобальное сглаживание (не между кадрами)

### Callbacks

```tsx
import { animate, utils } from 'animejs';

const [ $value ] = utils.$('.value');

const animation = animate('.circle', {
  x: '16rem',
  delay: 1000, // Delays the onBegin() callback by 1000ms
  onBegin: self => $value.textContent = self.began
});
```

**onBegin**
**onComplete**
**onBeforeUpdate**
**onUpdate**
**onRender**
**onLoop**
**onPause**

**then()** - animate возвращает промис, потому можно его либо возвращать в асинк функциях, либо в пайп then кидать
