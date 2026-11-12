## Природа уязвимости

SQL-инъекция возникает, когда **пользовательские данные конкатенируются в текст SQL-запроса**. СУБД получает единую строку и не может отличить, какая её часть — команда разработчика, а какая — данные пользователя. Злоумышленник дописывает синтаксис SQL и меняет смысл запроса.

Это тот же класс уязвимостей, что XSS: **смешение кода и данных в одном канале**.

## Опасный подход

```js
// ❌ Node.js
const q = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
db.query(q);
```

```python
# ❌ Python
cursor.execute("SELECT * FROM users WHERE email = '" + email + "'")
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")   # f-строка так же опасна
```

```php
// ❌ PHP
$sql = "SELECT * FROM users WHERE id = " . $_GET['id'];
```

## Как это эксплуатируется

**Обход аутентификации.** Ввод в поле email: `' OR '1'='1' -- `

```sql
SELECT * FROM users WHERE email = '' OR '1'='1' -- ' AND password = '...'
```

Условие истинно всегда, остаток запроса закомментирован — вход выполнен под первым пользователем (часто администратором).

**Извлечение чужих данных через UNION:**

```
' UNION SELECT username, password, NULL FROM admin_users --
```

**Разрушение данных** (если драйвер разрешает несколько операторов):

```
'; DROP TABLE users; --
```

**Слепая инъекция (blind SQLi).** Ответ не показывает данные, но поведение различается:

- *булева*: `' AND SUBSTRING(password,1,1)='a' --` — страница отличается при верной догадке;
- *временная*: `' AND SLEEP(5) --` — задержка ответа выдаёт истинность условия.

Побайтовый перебор автоматизируется (sqlmap) и извлекает всю базу за минуты.

**Second-order injection.** Опасная строка сначала безопасно сохраняется в БД, а затем подставляется в другой запрос без экранирования.

Последствия: утечка персональных данных и хешей паролей, обход авторизации, изменение и удаление данных, в некоторых конфигурациях — чтение/запись файлов и выполнение команд ОС (`xp_cmdshell`, `COPY ... FROM PROGRAM`).

## Почему экранирование вручную — плохое решение

Попытки «почистить» ввод (удалить кавычки, экранировать спецсимволы своими руками) ломаются на: разных кодировках (GBK, multibyte-обходы), числовых контекстах без кавычек (`WHERE id = 1 OR 1=1` — кавычки не нужны), различиях диалектов, комментариях (`--`, `#`, `/* */`), альтернативных представлениях (`CHAR(39)`, шестнадцатеричные литералы). Чёрные списки обходятся всегда.

## Безопасный подход: параметризованные запросы

**Prepared statements** передают SQL и данные **раздельно**. Сервер БД сначала разбирает шаблон запроса и строит план, а затем подставляет значения как **типизированные данные**. Данные принципиально не могут стать частью синтаксиса — даже строка `' OR 1=1 --` будет искаться как обычное значение поля.

```js
// ✅ Node.js, node-postgres
const { rows } = await db.query(
  'SELECT * FROM users WHERE email = $1 AND active = $2',
  [email, true]
);

// ✅ mysql2
const [rows] = await conn.execute(
  'SELECT * FROM users WHERE email = ? AND role = ?',
  [email, role]
);
```

```python
# ✅ Python, psycopg
cur.execute("SELECT * FROM users WHERE email = %s AND age > %s", (email, age))

# ✅ sqlite3
cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))

# ✅ именованные параметры
cur.execute("SELECT * FROM users WHERE email = :email", {"email": email})
```

```java
// ✅ JDBC
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
ps.setString(1, email);
```

Побочный плюс: план запроса кешируется, что ускоряет повторные вызовы.

## ORM и query builders

```js
// Prisma
await prisma.user.findMany({ where: { email } });

// Sequelize
await User.findOne({ where: { email } });

// Knex
await knex('users').where({ email }).select('*');
```

ORM параметризуют запросы автоматически, но **не отменяют осторожности**: методы вида `raw`, `queryRaw`, `literal`, `whereRaw` возвращают ответственность разработчику.

```js
// ❌
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
// ✅ тегированный шаблон параметризуется
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

## Что нельзя параметризовать

Параметры подставляются только **на место значений**. Имена таблиц, столбцов, направление сортировки и `LIMIT` в некоторых драйверах параметрами быть не могут:

```js
// ❌ уязвимо
const q = `SELECT * FROM users ORDER BY ${sortField} ${sortDir}`;

// ✅ белый список
const FIELDS = { name: 'name', date: 'created_at' };
const DIRS = { asc: 'ASC', desc: 'DESC' };
const field = FIELDS[sortField] ?? 'created_at';
const dir = DIRS[sortDir] ?? 'DESC';
const q = `SELECT * FROM users ORDER BY ${field} ${dir}`;
```

Здесь единственная надёжная защита — **сопоставление с фиксированным списком допустимых значений**, а не экранирование.

## Эшелонированная защита

1. **Параметризованные запросы везде** — основной рубеж.
2. **Валидация ввода** по типу и формату (число — значит число).
3. **Принцип наименьших привилегий**: у приложения отдельная роль БД без прав `DROP`, `CREATE`, доступа к системным таблицам; чтение отчётов — под read-only ролью.
4. **Хранимые процедуры** — помогают, но только если внутри них нет динамического SQL с конкатенацией.
5. **Не показывать пользователю тексты ошибок БД** — они помогают злоумышленнику. Логировать подробности, отдавать общее сообщение.
6. **Хеширование паролей** (bcrypt/argon2) — ограничивает ущерб при утечке.
7. **Шифрование чувствительных данных**, регулярные бэкапы, аудит-логи.
8. **WAF** — дополнительный, легко обходимый слой; не замена коду.
9. **Мониторинг аномалий**: всплеск ошибок SQL, необычно долгие запросы.
10. **Проверки в CI**: статический анализ, запрет строковой конкатенации в SQL на уровне линтера, регулярные тесты (sqlmap в staging).

## Схема опасного и безопасного подхода

```
ОПАСНО
пользовательский ввод ──► конкатенация строк ──► единая строка SQL ──► СУБД
                                                  (код и данные смешаны)

БЕЗОПАСНО
шаблон SQL ─────────────────────────────► СУБД: разбор, план
пользовательский ввод ──► параметр ─────► СУБД: подстановка как ЗНАЧЕНИЕ
                                          (код и данные разделены)
```

Тот же принцип применим к любым инъекциям: NoSQL (`$where`, операторы в объекте запроса), LDAP, XPath, командной строке (`exec` со склейкой аргументов), шаблонизаторам (SSTI). Общий рецепт — **не строить исполняемые конструкции конкатенацией недоверенных данных**.

---

---

## Источники

- [SQL Injection — OWASP](https://owasp.org/www-community/attacks/SQL_Injection)
- [SQL Injection Prevention Cheat Sheet — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Query Parameterization Cheat Sheet — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html)
- [PREPARE — PostgreSQL](https://www.postgresql.org/docs/current/sql-prepare.html)
