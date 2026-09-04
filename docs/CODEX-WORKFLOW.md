# CODEX-WORKFLOW.md

## Objetivo

Este documento define cómo debe trabajar Codex dentro del repositorio
del proyecto Servicios {ciudad}.

La implementación debe respetar estrictamente el control de versiones
con Git.

Codex puede modificar archivos, crear archivos, ejecutar pruebas,
corregir errores y preparar cambios.

Codex NO debe realizar commits.

El nombre y momento de cada commit serán definidos manualmente por el
responsable del proyecto.

---

# 1. Regla principal de Git

Codex NO debe ejecutar:

    git commit

Codex NO debe ejecutar:

    git push

Codex NO debe ejecutar:

    git merge

Codex NO debe crear tags.

Codex NO debe reescribir historial.

Codex NO debe ejecutar:

    git reset --hard

Codex NO debe ejecutar comandos destructivos que eliminen trabajo
existente sin aprobación explícita.

El responsable del proyecto realizará manualmente los commits cuando
considere que una implementación se encuentra estable.

---

# 2. Antes de comenzar cualquier tarea

Antes de modificar archivos, Codex debe:

1. Leer `/docs/MVP-SPEC.md`.
2. Leer este documento `/docs/CODEX-WORKFLOW.md`.
3. Inspeccionar la estructura actual del repositorio.
4. Ejecutar:

       git status

5. Identificar si existen cambios previos sin commit.
6. No sobrescribir ni eliminar cambios existentes sin entenderlos.
7. Informar brevemente qué archivos espera modificar.
8. Proponer un plan corto antes de implementar.

Si existen cambios sin commit que no correspondan a la tarea actual,
Codex debe conservarlos y evitar modificarlos innecesariamente.

---

# 3. Trabajo por fases

Codex debe trabajar únicamente sobre la fase solicitada.

Ejemplo:

    "Implementa Fase técnica 2 — Datos"

significa que Codex debe implementar exclusivamente esa fase.

No avanzar automáticamente a:

- frontend;
- panel del repartidor;
- tracking;
- funcionalidades posteriores;

si no han sido solicitadas.

---

# 4. Tamaño de los cambios

Preferir cambios pequeños y verificables.

Evitar modificar una gran cantidad de archivos cuando no sea
necesario.

Cada tarea debe intentar dejar el proyecto en un estado ejecutable y
estable.

Evitar refactors no relacionados con la tarea actual.

---

# 5. Cambios existentes

Antes de modificar un archivo existente:

1. Revisar su contenido actual.
2. Entender si contiene trabajo previo.
3. Mantener compatibilidad con implementaciones ya aprobadas.

No reemplazar archivos completos únicamente por comodidad si basta con
modificar una sección.

No eliminar funcionalidades previamente implementadas salvo que la
tarea lo solicite.

---

# 6. Dependencias

Antes de instalar una nueva dependencia:

1. Comprobar si realmente es necesaria.
2. Verificar si una dependencia existente ya resuelve el problema.
3. Evitar librerías innecesarias.

Si se agrega una dependencia, Codex debe informarla al terminar.

No cambiar de framework, ORM o stack tecnológico sin aprobación.

Stack aprobado:

- Next.js
- JavaScript
- Tailwind CSS
- MySQL
- Aiven
- Drizzle ORM
- Vercel

NO migrar el proyecto a TypeScript.

---

# 7. Variables de entorno

Nunca escribir secretos reales dentro del repositorio.

No modificar `.env.local` salvo que sea necesario para pruebas locales
y nunca incluir secretos en archivos versionados.

Actualizar `.env.example` cuando aparezca una nueva variable requerida.

Nunca incluir:

- contraseñas;
- tokens;
- credenciales de Aiven;
- claves privadas;
- secretos de producción.

---

# 8. Migraciones de base de datos

Las migraciones forman parte del control de versiones.

Si una tarea modifica el esquema:

1. Actualizar `schema.js`.
2. Generar la migración correspondiente.
3. No modificar migraciones históricas ya aplicadas salvo instrucción
   explícita.
4. Crear una migración nueva para cambios posteriores.
5. Informar claramente qué cambió en la base de datos.

Evitar cambios manuales de estructura directamente en producción que
no estén representados en migraciones.

Los datos de desarrollo pueden manejarse mediante seeds.

---

# 9. Seeds

Los seeds deben utilizar exclusivamente información ficticia o
claramente identificada como datos de desarrollo.

No incluir datos personales reales.

Si el seed cambia, informar qué datos se agregaron o modificaron.

---

# 10. Verificación obligatoria

Antes de considerar terminada una tarea, Codex debe ejecutar cuando
aplique:

    npm run lint

y:

    npm run build

Si existen pruebas automatizadas:

    npm test

o el comando equivalente definido por el proyecto.

No declarar la implementación estable si alguno de estos comandos
falla.

Corregir los errores relacionados con la implementación actual antes
de terminar.

---

# 11. Revisión del estado Git al terminar

Cuando la tarea esté completa, Codex debe ejecutar:

    git status

y:

    git diff --stat

También debe revisar:

    git diff

para comprobar que no existen cambios accidentales.

Codex NO debe hacer commit.

---

# 12. Reporte final de cada tarea

Al finalizar, Codex debe entregar un resumen con esta estructura:

## Implementado

Descripción breve de la funcionalidad terminada.

## Archivos creados

- archivo
- archivo

## Archivos modificados

- archivo
- archivo

## Dependencias agregadas

- dependencia

Si no hubo nuevas dependencias, indicar:

    Ninguna.

## Variables de entorno nuevas

- VARIABLE=

Si no existen:

    Ninguna.

## Cambios de base de datos

Indicar:

- tablas creadas;
- columnas agregadas;
- índices;
- foreign keys;
- migraciones.

Si no hubo cambios:

    Ninguno.

## Validaciones ejecutadas

    npm run lint → OK
    npm run build → OK

Agregar cualquier otra prueba realizada.

## Estado de Git

Mostrar brevemente los archivos pendientes de commit.

## Pendiente para revisión manual

Indicar cualquier elemento que el responsable deba verificar antes de
realizar el commit.

---

# 13. Commits

Codex debe dejar todos los cambios preparados pero sin commit.

El responsable decidirá:

- cuándo la implementación está estable;
- qué archivos incluir;
- nombre del commit;
- cuándo hacer push.

Codex puede sugerir el alcance lógico de un commit si se le solicita,
pero NO debe crearlo.

---

# 14. No utilizar Git automáticamente para corregir errores

Si una implementación falla:

NO usar:

    git checkout .
    git restore .
    git reset --hard

como mecanismo automático de recuperación.

Corregir los archivos afectados.

Si fuera necesario revertir trabajo previo, solicitar aprobación antes.

---

# 15. Ramas

Por defecto Codex debe trabajar en la rama actualmente activa.

No crear nuevas ramas automáticamente.

Si el responsable indica una rama específica, trabajar en ella.

Codex puede consultar:

    git branch --show-current

pero no cambiar de rama sin instrucción.

---

# 16. Protección del trabajo del usuario

Asumir que cualquier cambio no realizado por Codex puede ser trabajo
manual del responsable.

Nunca eliminarlo sin aprobación.

Si existe un conflicto entre la tarea solicitada y cambios locales
existentes, detenerse e informar el conflicto antes de sobrescribirlos.

---

# 17. Actualización de documentación

Cuando una implementación cambie una decisión funcional o técnica
documentada, revisar si debe actualizarse:

    /docs/MVP-SPEC.md

No modificar reglas de negocio unilateralmente.

Si existe una contradicción entre código y especificación, señalarla
antes de decidir.

---

# 18. Definition of Done de una tarea

Una tarea se considera técnicamente terminada cuando:

1. La funcionalidad solicitada está implementada.
2. No se implementaron funcionalidades fuera del alcance.
3. El proyecto ejecuta correctamente.
4. Lint pasa.
5. Build pasa.
6. Migraciones están versionadas cuando aplican.
7. `.env.example` está actualizado cuando aplica.
8. No existen secretos en archivos versionados.
9. El diff fue revisado.
10. Codex entregó el reporte de cambios.
11. No se realizó commit.

La decisión final de realizar el commit pertenece al responsable del
proyecto.