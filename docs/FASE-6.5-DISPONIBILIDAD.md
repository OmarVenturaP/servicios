# Fase 6.5 — Disponibilidad programada

## Arquitectura existente detectada

Los servicios se almacenan en `dat_servicios` y cada prestador operativo en `dat_unidades`. Antes de esta fase, la disponibilidad efectiva dependía de una unidad activa, un estado activo con clave `disponible` y `estado_hasta > NOW()`. El acceso privado usa `/u/[token]`, conserva solamente el SHA-256 en `token_hash` y actualiza estado y bitácora en una transacción. La landing, el precio mínimo y el contacto compartían esa condición. El orden público usa capacidad disponible y rotación aleatoria; la selección de contacto conserva su rotación histórica.

No se encontraron módulos de GPS, ubicación o mapa en el repositorio. Por ello esta fase no inventa ni modifica esas funciones. El “ranking” existente es únicamente el orden público por disponibilidad, cantidad y rotación.

## Modelo extendido

- `cat_ciudades.zona_horaria`: zona IANA; Tonalá utiliza `America/Mexico_City`.
- `dat_unidades.modo_disponibilidad`: `manual` o `programado`, con `manual` por defecto.
- `dat_unidades.excepcion_estado` y `excepcion_hasta`: cambio temporal con prioridad.
- `dat_horarios_unidad`: hasta dos bloques por día y por unidad.

La migración es aditiva. Las unidades existentes permanecen en modo manual, sin horario ni excepción, por lo que conservan su comportamiento.

## Cálculo efectivo

La función de dominio `getEffectiveAvailability(unit, now)` aplica este orden: unidad deshabilitada, excepción vigente, modo manual existente y, finalmente, horario semanal. Los rangos usan `[inicio, fin)`: la hora inicial se incluye y la final se excluye. La consulta SQL equivalente se reutiliza en landing, precio mínimo y contacto. No existe un cron que altere estados.

En modo programado, una pausa o activación temporal puede durar 30 minutos, 1 hora, 2 horas o hasta que el repartidor la retire. Una excepción vencida se ignora. Si no hay horario válido, la unidad no se publica como disponible.

## Panel del repartidor

El panel conserva precio y acciones manuales. Añade selección explícita de modo, editor semanal mobile-first, máximo de dos bloques por día, atajos para copiar horarios y controles de pausa o disponibilidad temporal. Toda escritura valida el token en servidor y una unidad solamente modifica su propia configuración.

## Impacto y compatibilidad

- Listado, precio y contacto usan la nueva disponibilidad efectiva.
- El orden recomendado y la rotación de contactos no cambian.
- Los servicios continúan publicados aunque no tengan unidades en horario.
- No hay impacto sobre GPS/mapa porque no existen en esta versión del proyecto.
- El panel administrativo conserva sus controles y recibe el estado efectivo calculado.
- Acceso por token, WhatsApp, llamada, logs y precio base mantienen sus contratos.

## Validación y limitaciones

El servidor valida horas, máximo de bloques, campos incompletos y solapamientos. Esta primera versión no permite horarios que crucen medianoche; deben dividirse en dos días. Tampoco incluye feriados, calendarios por fecha, copia entre unidades ni aplicación masiva. La siguiente disponibilidad se calcula en servidor usando la zona IANA, nunca la hora del dispositivo.

Las pruebas cubren modo manual compatible, modo programado, límites del intervalo, dos bloques, día cerrado, excepciones vigentes/vencidas, validaciones y siguiente disponibilidad con cambio de día.
