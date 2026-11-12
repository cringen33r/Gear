## Механика

Значения аргументов по умолчанию в Python вычисляются **один раз — в момент определения функции**, а не при каждом вызове. Они сохраняются в атрибуте `__defaults__` объекта функции и переиспользуются всеми вызовами.

```python
def f(x=[]):
    x.append(1)
    return x

print(f())  # [1]
print(f())  # [1, 1]   ← тот же самый список!
print(f())  # [1, 1, 1]
print(f.__defaults__)  # ([1, 1, 1],)
```

Это одна из самых известных «ловушек» языка (mutable default argument).

Наглядное подтверждение того, что объект один:

```python
def g(items=[]):
    print(id(items))
g(); g()   # одинаковый id
```

Ещё нагляднее с вычисляемым значением:

```python
import datetime

def log(msg, ts=datetime.datetime.now()):   # время фиксируется при импорте модуля!
    print(ts, msg)
```

## Почему так сделано

Определение функции — обычная инструкция, выполняемая один раз при загрузке модуля. Выражения в сигнатуре вычисляются тогда же. Альтернатива (вычислять при каждом вызове) потребовала бы хранить AST выражения и исполнять его на каждом вызове — дороже и менее предсказуемо в плане области видимости. Плюс текущая семантика позволяет полезные приёмы, например кеш или «связывание» переменной цикла:

```python
funcs = [lambda i=i: i for i in range(3)]   # i захвачена по значению
print([f() for f in funcs])                 # [0, 1, 2]
```

## Правильное решение: сентинел None

```python
def f(x=None):
    if x is None:
        x = []          # новый список на каждый вызов
    x.append(1)
    return x
```

Если `None` — допустимое значение аргумента, используют уникальный объект-маркер:

```python
_MISSING = object()

def f(x=_MISSING):
    if x is _MISSING:
        x = compute_default()
    ...
```

## Опасные типы

Изменяемые (mutable): `list`, `dict`, `set`, `bytearray`, экземпляры пользовательских классов, `collections.defaultdict`, `Counter`.

Безопасные (immutable): `int`, `float`, `str`, `bool`, `None`, `tuple` (при условии, что внутри тоже неизменяемые), `frozenset`.

```python
def ok(x=0, s='', t=(), fs=frozenset()):   # безопасно
    ...
```

## Реальные последствия

```python
class Node:
    def __init__(self, name, children=[]):   # БАГ
        self.name = name
        self.children = children

a = Node('a'); b = Node('b')
a.children.append('x')
print(b.children)   # ['x'] — все узлы делят один список
```

Аналогично с кешами, аккумуляторами, конфигурациями. Ошибка коварна тем, что проявляется не сразу и зависит от порядка вызовов — тесты, выполняющиеся изолированно, её не находят.

## Порядок и виды параметров

```python
def f(pos_only, /, standard, *args, kw_only, **kwargs):
    ...
```

- До `/` — только позиционные (PEP 570).
- После `*` или `*args` — только именованные (keyword-only). Для них дефолт особенно полезен.
- Параметры с дефолтом обязаны идти **после** параметров без дефолта, иначе `SyntaxError`.

```python
def connect(host, port=5432, *, timeout=30, retries=3):
    ...
connect('db.local', timeout=5)
```

## Осознанное использование мутабельного дефолта

Изредка приём применяют намеренно — как кеш или счётчик:

```python
def fib(n, _cache={0: 0, 1: 1}):
    if n not in _cache:
        _cache[n] = fib(n - 1, _cache) + fib(n - 2, _cache)
    return _cache[n]
```

Работает, но читаемость страдает; предпочтительнее `functools.lru_cache` или явный атрибут.

## Смежные грабли

**Изменяемые атрибуты класса** — та же природа ошибки:

```python
class Bad:
    items = []          # общий для ВСЕХ экземпляров

class Good:
    def __init__(self):
        self.items = []  # свой у каждого
```

**Dataclass** явно защищает от этого:

```python
from dataclasses import dataclass, field

@dataclass
class Config:
    tags: list[str] = field(default_factory=list)   # правильно
    # tags: list[str] = []   → ValueError при определении класса
```

**Аннотации типов** не влияют на выполнение — они не превращают дефолт в безопасный.

## Передача аргументов в Python

Модель называют «call by object reference» (или call by sharing): в функцию передаётся ссылка на объект. Поэтому:

```python
def mutate(lst): lst.append(1)     # видно снаружи — объект изменён на месте
def rebind(lst): lst = [9]         # НЕ видно снаружи — переприсвоено локальное имя
```

Понимание этой модели и объясняет, почему изменение дефолтного списка «остаётся» между вызовами.

## Инструменты

Линтеры находят проблему автоматически: `pylint` (W0102 dangerous-default-value), `ruff`/`flake8-bugbear` (B006 mutable-argument-default). Их стоит включить в CI.

---

---

## Источники

- [Default Argument Values — Python Tutorial](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)
- [Why are default values shared between objects? — Python FAQ](https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects)
- [dataclasses: mutable default values](https://docs.python.org/3/library/dataclasses.html#mutable-default-values)
- [PEP 570 — Positional-Only Parameters](https://peps.python.org/pep-0570/)
