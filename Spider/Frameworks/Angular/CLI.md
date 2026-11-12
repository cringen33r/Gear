# Глобальные

`--dry-run / -d (false)` 
Пробный запуск с отображением вывода но без реальных изменений.
`--defaults (false)` 
Пропуск интерактивности с установкой значений по умолчанию.
`--force (false)` 
Перезапись файлов.
`--interactive (true)`
`--help`
# ng new / ng n
## Важные
`--package-manager (npm / yarn / pnpm / cnpm / bun)`
`--standalone (true)`
`--prefix / -p (app)`
`--routing (false)`
`--ssr (false)`
`--style (css / scss / sass / less)`
`--zoneless (false)`
`--create-application (true)` 
Генерация приложения в src/app.
## Полезные
`--minimal (false)`
Облегчённая версия для пробников. По сути, устанавливает `--inline-style/template` и `--skip-tests` в `true`
`--new-projects-root (projects)`
Путь, где будут создаваться новые проекты.
`--skip-git / -g (false)`
`--colection / -c`
Набор схематиков
# ng add

Добавляет пакет для указанной публичной библиотеки и конфигурирует проект под его использование в соответствии с инструкциями в *схематике* библиотеки.

`--verbose (false)`
Отображение дополнительной информации во время выполнения.

`--skip-confirmation (false)`

`--registry`
npm-репозиторий

# ng analytics disable/enable/info/prompt

Переключает режим сбора статистики.

# ng generate / ng g

## app-shell

Конфигурирует проект для использования App Shell паттерна.

## application (app)

Генерация приложения внутри воркспейса. Те же опции что и при `ng new`, однако есть ещё `--project-root (projects)`.

## class (cl)

Создание кастомного класса. Принимает `skip-tests` и `type`, который просто определяет кастомный тип (часть названия, стоящая между именем и расширением).

## component (c)

`--change-detection (Default / OnPush)`
`--type`

## config

Генерирует конфиг либо для `karma` или для `browsersList`

## directive

Генерация директивы
## guard

`--functional (true)`
Создание как функции а не класса (для простых сценариев)

`--implements`
Указание типов гарда

