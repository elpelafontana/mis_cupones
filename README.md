# Mis Cupones

Una app personal para guardar tus códigos de descuento. Login simple de un
solo usuario (no es multiusuario), datos persistidos en una base Turso
(SQLite), pensada para desplegarse gratis en Vercel.

## Requisitos

- Node.js 20 o superior
- Una cuenta gratuita en [Turso](https://turso.tech) (para la base de datos)
- Una cuenta gratuita en [Vercel](https://vercel.com) (para publicarla)

## 1. Instalación local

```bash
npm install
cp .env.local.example .env.local
```

## 2. Generar tus credenciales

Elegí un usuario (no hace falta que sea un email, puede ser algo simple como
`admin`) y generá el hash de tu contraseña:

```bash
npm run hash-password
```

Te va a pedir la contraseña por consola y te va a imprimir una línea como:

```
AUTH_PASSWORD_HASH=JDJiJDEyJGV4...
```

Pegá esa línea en `.env.local`, y completá también `AUTH_USER` con el
usuario que elegiste. Para `JWT_SECRET`, generá cualquier cadena larga
aleatoria, por ejemplo con `openssl rand -base64 32`.

**Importante:** `AUTH_PASSWORD_HASH` se guarda codificado en base64 a
propósito (no es el hash de bcrypt "crudo"). Es así por diseño: el hash de
bcrypt trae signos `$` que algunos cargadores de variables de entorno
interpretan como una expansión y lo corrompen. Siempre generalo con
`npm run hash-password`, nunca lo pegues a mano.

## 3. Probar en local

```bash
npm run dev
```

Abrí `http://localhost:3000`. Como todavía no configuraste Turso, la app usa
automáticamente un archivo `local.db` en el proyecto — perfecto para
programar y probar sin depender de internet. Este archivo está en
`.gitignore`, no se sube al repo.

## 4. Crear la base de datos en Turso (para producción)

```bash
# Instalar el CLI (una sola vez)
curl -sSfL https://get.tur.so/install.sh | bash

turso auth signup    # o "turso auth login" si ya tenés cuenta
turso db create mis-cupones
turso db shell mis-cupones < schema.sql

# Vas a necesitar estos dos valores para el siguiente paso:
turso db show mis-cupones --url
turso db tokens create mis-cupones
```

## 5. Deploy en Vercel

1. Subí este proyecto a un repo de GitHub.
2. En [vercel.com](https://vercel.com), importá el repo (Vercel detecta
   Next.js automáticamente, no hace falta tocar la configuración de build).
3. Antes de hacer el primer deploy, cargá las variables de entorno en
   **Settings → Environment Variables**:
   - `AUTH_USER`
   - `AUTH_PASSWORD_HASH` (la versión en base64)
   - `JWT_SECRET`
   - `TURSO_DATABASE_URL` (la url que te dio `turso db show`)
   - `TURSO_AUTH_TOKEN` (el token que te dio `turso db tokens create`)
4. Deploy. Listo — tu app va a estar en `https://tu-proyecto.vercel.app`.

## Estructura del proyecto

```
app/
  login/          → pantalla de login
  dashboard/       → pantalla principal (lista + alta/edición de códigos)
  api/
    login/         → valida usuario/contraseña, crea la cookie de sesión
    logout/        → borra la cookie
    codigos/       → GET (listar) y POST (crear)
    codigos/[id]/  → PUT (editar) y DELETE (borrar)
lib/
  db.ts            → conexión a Turso (o local.db en desarrollo)
  auth.ts          → firma/verifica el JWT de sesión
  limiteIntentos.ts → límite de reintentos de login por IP
proxy.ts           → protege /dashboard y /api/codigos si no hay sesión
schema.sql         → esquema de la tabla codigos_descuento
scripts/
  hash-password.mjs → genera AUTH_PASSWORD_HASH de forma segura
```

## Notas de seguridad

- Las contraseñas nunca se guardan en texto plano, solo su hash bcrypt.
- La cookie de sesión es `httpOnly` (no accesible desde JavaScript del
  navegador) y expira a los 7 días.
- **Límite de reintentos**: después de 5 intentos fallidos desde el mismo
  origen, el login se bloquea 15 minutos (aunque la contraseña sea
  correcta). El bloqueo se guarda en la base (tabla `intentos_login`), no en
  memoria, así que funciona bien aunque el servidor duerma o reinicie entre
  intentos. Un login exitoso borra el contador. Podés ajustar los números
  en `lib/limiteIntentos.ts` (`UMBRAL_INTENTOS` y `DURACION_BLOQUEO_MINUTOS`).
