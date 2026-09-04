# Servicios

Proyecto base en JavaScript con Next.js, Tailwind CSS, MySQL y Drizzle ORM,
preparado para usar una base de datos administrada por Aiven y desplegarse en Vercel.

## Desarrollo local

Requisitos: Node.js 20.9 o superior y una instancia MySQL en Aiven.

1. Copia `.env.example` como `.env.local`.
2. En Aiven, copia la URI de conexión del servicio MySQL en `DATABASE_URL`.
3. Descarga el certificado CA de Aiven, conviértelo a Base64 y guárdalo en
   `AIVEN_CA_CERT_BASE64`.
4. Crea o actualiza las tablas con `npm run db:push`.
5. Inicia el proyecto con `npm run dev`.

La API inicial expone:

- `GET /api/services`: lista los servicios.
- `POST /api/services`: crea un servicio con `{ "name": "...", "description": "..." }`.

## Migraciones con Drizzle

- `npm run db:generate`: genera migraciones a partir del esquema.
- `npm run db:migrate`: aplica las migraciones pendientes.
- `npm run db:studio`: abre Drizzle Studio.

Para usar los comandos de Drizzle, define `DATABASE_URL` en un archivo `.env`.
Next.js también lee `.env.local` al ejecutar la aplicación.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio Git.
2. Impórtalo en Vercel como proyecto Next.js.
3. Agrega `DATABASE_URL` y `AIVEN_CA_CERT_BASE64` en
   **Settings > Environment Variables** para los entornos deseados.
4. Despliega. Vercel detecta Next.js automáticamente; no hace falta `vercel.json`.

Antes del primer uso en producción, ejecuta las migraciones contra la base de datos de Aiven desde un entorno seguro.
