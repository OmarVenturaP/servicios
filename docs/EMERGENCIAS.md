# Apartado fijo de Emergencias

La implementación utiliza `dat_contactos_emergencia` como directorio institucional independiente de servicios, unidades, disponibilidad, precios, contactos comerciales y analítica comercial.

## Números cortos autorizados

La primera versión permite `911`, `089`, `088` y `078` exclusivamente para registros cuyo país sea México.

- `911`: número único de emergencias.
- `089`: denuncia anónima; no sustituye la atención inmediata del 911.
- `088`: atención ciudadana de Guardia Nacional.
- `078`: auxilio mecánico, orientación turística y asistencia en carretera de Ángeles Verdes.

Fuentes oficiales: [diferencias entre 088, 089 y 911](https://www.gob.mx/sspc/es/articulos/sabes-cual-es-la-diferencia-entre-los-numeros-088-089-y-911) y [servicio 078 de Ángeles Verdes](https://www.gob.mx/sectur/angelesverdes/es/articulos/078-el-numero-gratuito-que-te-acompana-auxilia-y-orienta).

Agregar otro número corto exige verificar primero una fuente oficial y ampliar explícitamente la lista por país en `src/domain/emergency-contacts.js`.

## Publicación

Los contactos se crean ocultos. Para publicar deben conservar teléfono válido, fuente HTTP/HTTPS, fecha de verificación no futura, datos obligatorios y ciudad activa. Cambiar teléfono, extensión, institución, ciudad, descripción, horario o fuente elimina la verificación y vuelve a ocultar el registro.

La migración de esta fase solamente crea la tabla e índices. No carga contactos. Debe aplicarse en el ambiente correspondiente con `npm run db:migrate` después de revisar el archivo SQL y configurar `DATABASE_URL`; esta tarea no la aplica a producción.
