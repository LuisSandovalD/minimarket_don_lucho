# Minimarket Don Lucho

Sistema administrativo comercial construido con Next.js, TypeScript, PostgreSQL, Prisma, Tailwind y componentes shadcn/ui. Incluye autenticación, RBAC, productos por unidad/peso/volumen, Kardex, POS compatible con lector USB, pagos, fiados, caja, importación Excel y auditoría.

## Requisitos

- Node.js 20.19 o superior (recomendado 24)
- PostgreSQL 15 o superior
- Cuenta Brevo para correos
- Cuenta Cloudinary para imágenes

## Instalación local

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Abra `http://localhost:3000` e ingrese con `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidos antes de ejecutar el seed.

## Variables de entorno

Copie `.env.example`. `AUTH_SECRET` debe tener al menos 32 caracteres aleatorios. `APP_URL` debe ser la URL pública real en producción; Brevo utiliza este valor para los enlaces. Las claves secretas de Brevo y Cloudinary se usan exclusivamente en el servidor.

## Base de datos y Prisma

- Desarrollo: `npm run db:migrate`
- Producción: `npm run db:deploy`
- Datos iniciales: `npm run db:seed`
- Validación: `npx prisma validate`

El seed es idempotente y crea permisos, roles Administrador/Cajero/Almacén/Supervisor, administrador, unidades, categorías, caja, Cliente General y configuración. Las credenciales nunca están hardcodeadas.

## Importar productos

1. Abra **Importaciones**.
2. Descargue la plantilla o seleccione su propio `.xlsx`/`.csv`.
3. Revise el mapeo automático de columnas.
4. Compruebe la vista previa.
5. Elija omitir o actualizar duplicados.
6. Confirme.

Los códigos se tratan como texto para conservar ceros iniciales. Cada alta con stock genera `InventoryMovement`; los cambios de precio generan historial y auditoría. El límite actual es de 5000 filas y el tamaño se configura con `MAX_UPLOAD_MB`.

## Roles y permisos

La interfaz oculta módulos no autorizados, pero la autoridad final siempre es el servidor mediante `requirePermission`. Las operaciones sensibles registran `AuditLog` y eliminan secretos de los valores antes/después.

## Producción

Configure todas las variables en el proveedor, ejecute `npm run db:deploy` y después `npm run build`. Use HTTPS para habilitar cookies seguras. `APP_URL` debe coincidir con el dominio final.

## Calidad

```bash
npm run check
```

Ejecuta lint, TypeScript, pruebas y build. El flujo de CI repite estas validaciones en cada push y pull request.

## Estado del alcance

La base, autenticación, RBAC, catálogo, stock inicial/Kardex, importación, caja, POS, ventas, pagos y fiados están conectados a PostgreSQL. Los módulos avanzados restantes deben ampliarse sobre los modelos existentes antes de considerar cumplido el alcance total de las 16 fases: CRUD administrativo completo, compras transaccionales, abonos, devoluciones/anulaciones, tickets, exportaciones, reportes avanzados, Cloudinary en formularios y cobertura integral de pruebas.
