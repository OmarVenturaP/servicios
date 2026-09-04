# Servicios {ciudad}
## Especificación funcional y técnica — MVP v1.0

> Estado: Aprobado para implementación inicial  
> Ciudad piloto: Tonalá, Chiapas, México  
> Arquitectura: Multi-ciudad  
> Plataforma: Web / Mobile First

---

# 1. Propósito del documento

Este documento define el alcance funcional y técnico del MVP de la
plataforma temporalmente denominada:

**Servicios {ciudad}**

Para la primera implementación:

**Servicios Tonalá**

Este documento debe considerarse la fuente principal de verdad para
la implementación.

No agregar funcionalidades que no estén definidas aquí sin actualizar
previamente esta especificación.

El objetivo es construir únicamente lo necesario para validar:

1. Que existe suficiente oferta de motomandados.
2. Que los usuarios buscan opciones disponibles.
3. Que la plataforma genera contactos.
4. Que esos contactos tienen valor para los proveedores.
5. Que eventualmente existe disposición a pagar por participar.

---

# 2. Concepto del producto

Servicios {ciudad} es un directorio dinámico de servicios locales.

La primera categoría disponible será:

**Mandados / Motomandados**

La plataforma permitirá encontrar servicios que tengan repartidores
realmente disponibles en ese momento y contactarlos directamente.

La plataforma NO realizará el servicio.

La plataforma NO será intermediaria del pago.

La plataforma NO tendrá inicialmente chat interno.

La plataforma NO asignará viajes.

La plataforma NO procesará pagos entre cliente y proveedor.

El contacto ocurre directamente entre:

Cliente → Servicio / Repartidor

mediante:

- WhatsApp
- Llamada telefónica

---

# 3. Propuesta de valor del MVP

La principal diferencia frente a un directorio tradicional es:

**mostrar quién está disponible ahora.**

No queremos únicamente mostrar:

- nombre;
- teléfono;
- horario;
- descripción.

Queremos responder:

> Necesito un motomandado ahora.
> ¿Quién está disponible?

Por esta razón, la disponibilidad dinámica de las unidades forma
parte del MVP y no debe tratarse como una funcionalidad futura.

---

# 4. Arquitectura multi-ciudad

La primera ciudad será:

- Tonalá
- Chiapas
- México

La arquitectura debe permitir posteriormente agregar otras ciudades
sin realizar una migración estructural.

Ejemplos futuros:

- Servicios Arriaga
- Servicios Pijijiapan
- Servicios Mapastepec
- Servicios Tapachula

No implementar funcionalidad específica para esas ciudades todavía.

Nunca hardcodear "Tonalá" dentro de lógica que deba funcionar para
cualquier ciudad.

Los textos públicos deben obtener la ciudad desde los datos cuando
sea razonable.

---

# 5. Stack tecnológico

## Aplicación

- Next.js
- JavaScript
- archivos `.js` / `.jsx`
- NO utilizar TypeScript

## UI

- Tailwind CSS
- diseño Mobile First
- Lucide Icons o equivalente para iconografía general

## Base de datos

- MySQL 8
- Aiven inicialmente
- Drizzle ORM

## Administración inicial

- TablePlus

No construir panel administrativo durante el MVP.

## Hosting

Aplicación:

- Vercel

Base de datos:

- Aiven MySQL

---

# 6. Convenciones de base de datos

Utilizar los siguientes prefijos.

### `cat_`

Catálogos.

Ejemplos:

- `cat_ciudades`
- `cat_estados_unidad`
- `cat_modos_contacto`

### `dat_`

Datos principales u operativos.

Ejemplos:

- `dat_servicios`
- `dat_unidades`

### `rel_`

Relaciones entre entidades cuando sean necesarias.

### `log_`

Eventos e históricos.

Ejemplos:

- `log_visitas`
- `log_contactos`
- `log_estados_unidad`

### `cfg_`

Configuraciones futuras.

### `vw_`

Vistas SQL.

---

# 7. Convención de columnas

Usar `snake_case`.

Ejemplos:

- `created_at`
- `updated_at`
- `estado_hasta`
- `precio_base`

Las llaves foráneas utilizarán:

`entidad_id`

Ejemplos:

- `ciudad_id`
- `servicio_id`
- `unidad_id`
- `estado_id`

NO utilizar:

- `id_servicio`
- `servicioId`
- `idServicio`

---

# 8. Modelo conceptual

La entidad comercial principal es:

**Servicio**

NO utilizar "Flotilla" como entidad principal.

Un servicio puede tener una o varias unidades.

Ejemplo de proveedor independiente:

    Motomandados Juan
        └── Unidad 1

Ejemplo de proveedor con varias motos:

    Motomandados El Profe
        ├── Unidad 1
        ├── Unidad 2
        └── Unidad 3

Esto es obligatorio para permitir que un proveedor pueda crecer de
una a múltiples unidades sin migrar su cuenta o cambiar el modelo.

NO guardar manualmente el número de motos dentro de `dat_servicios`.

La cantidad debe obtenerse desde `dat_unidades`.

---

# 9. Modelo de datos inicial

Tablas requeridas:

    cat_ciudades
    cat_estados_unidad
    cat_modos_contacto

    dat_servicios
    dat_unidades

    log_estados_unidad
    log_visitas
    log_contactos

No crear tablas adicionales sin una necesidad concreta.

---

# 10. cat_ciudades

Representa las ciudades habilitadas en la plataforma.

Campos requeridos:

- id
- nombre
- slug
- estado
- pais
- activo
- created_at
- updated_at

Ciudad inicial:

    nombre: Tonalá
    slug: tonala
    estado: Chiapas
    pais: México
    activo: true

---

# 11. cat_estados_unidad

Estados iniciales:

    disponible
    ocupado
    no_disponible

Campos:

- id
- clave
- nombre
- activo
- created_at

---

# 12. cat_modos_contacto

Debe permitir dos modelos:

    central
    unidad

## central

El cliente contacta al número general del servicio.

## unidad

El sistema selecciona una unidad disponible y utiliza el teléfono o
WhatsApp de esa unidad.

Campos:

- id
- clave
- nombre
- activo
- created_at

---

# 13. dat_servicios

Representa el servicio comercial visible públicamente.

Campos:

- id
- ciudad_id
- modo_contacto_id
- nombre
- slug
- telefono
- whatsapp
- descripcion
- cobertura_texto
- logo_url
- visible
- participa_piloto
- fuente
- notas
- created_at
- updated_at

Debe existir una restricción única equivalente a:

    ciudad_id + slug

Esto permite que un slug pueda existir en otra ciudad sin conflicto.

---

# 14. Cobertura

Durante el MVP la cobertura será:

- opcional;
- descriptiva;
- no utilizada para filtrar resultados.

Ejemplo:

    Centro, Evolución, Nicatán y alrededores.

NO crear todavía filtros obligatorios por colonia.

Tonalá será tratada como la zona general durante la validación.

---

# 15. dat_unidades

Cada unidad representa un repartidor/vehículo operativo perteneciente
a un servicio.

Campos requeridos:

- id
- servicio_id
- nombre
- telefono
- whatsapp
- precio_base
- estado_id
- estado_actualizado_at
- estado_hasta
- token_hash
- activo
- created_at
- updated_at

El campo `nombre` es opcional.

Ejemplos internos:

    Unidad 1
    Unidad 2
    Unidad 3

Los nombres de las unidades NO necesitan mostrarse públicamente.

---

# 16. Datos mínimos del repartidor

Durante el piloto solamente recopilar los datos estrictamente
necesarios.

NO solicitar inicialmente:

- INE;
- placas;
- dirección personal;
- documentos;
- fotografía personal;
- información sensible innecesaria.

---

# 17. Precio

El precio pertenece a la unidad.

Campo:

    precio_base

Tipo recomendado:

    DECIMAL(10,2)

El precio es persistente.

El repartidor NO necesita volver a introducir su precio cada vez que
se pone disponible.

Puede modificarlo desde su enlace privado.

---

# 18. Precio público

El servicio debe mostrar:

**Desde $X**

`X` debe calcularse utilizando el menor `precio_base` entre las
unidades efectivamente disponibles.

Ejemplo:

    Unidad 1 → Disponible → $40
    Unidad 2 → Disponible → $50
    Unidad 3 → Ocupada    → $35

Resultado:

    Desde $40

La unidad ocupada no participa en el cálculo.

Mostrar cerca del precio:

> El precio puede variar según distancia y tipo de servicio.

---

# 19. Disponibilidad

La disponibilidad pertenece a cada unidad.

Estados:

    disponible
    ocupado
    no_disponible

El estado guardado y el estado efectivo no necesariamente son lo
mismo.

La aplicación debe considerar también `estado_hasta`.

---

# 20. Estado Disponible

Cuando el repartidor selecciona:

**Estoy disponible**

establecer:

    estado = disponible
    estado_actualizado_at = NOW()
    estado_hasta = NOW() + 3 horas

La disponibilidad tiene una vigencia inicial de:

**3 horas**

Después del vencimiento, la unidad NO debe aparecer públicamente como
disponible.

No es obligatorio cambiar físicamente `estado_id` al vencer.

El estado efectivo puede calcularse en las consultas.

Una unidad está efectivamente disponible cuando:

    estado = disponible
    AND estado_hasta > NOW()
    AND activo = true

---

# 21. Renovar disponibilidad

Mientras esté disponible, el repartidor podrá seleccionar:

**Renovar 3 horas**

La nueva vigencia se calcula desde el momento de la renovación.

Ejemplo:

    Hora actual: 16:00

    Renovar 3 horas

    Nuevo estado_hasta: 19:00

No sumar necesariamente tres horas al vencimiento anterior.

---

# 22. Estado Ocupado

Cuando selecciona:

**Estoy ocupado**

establecer:

    estado = ocupado
    estado_actualizado_at = NOW()
    estado_hasta = NOW() + 1 hora

El estado ocupado tendrá vigencia máxima de:

**1 hora**

Al vencer, la unidad debe considerarse:

**No disponible**

hasta que el repartidor vuelva a actualizar su estado.

---

# 23. Estado No disponible

Cuando selecciona:

**Ya terminé / No disponible**

establecer:

    estado = no_disponible
    estado_actualizado_at = NOW()
    estado_hasta = NULL

Permanece así hasta una nueva acción del repartidor.

---

# 24. Histórico de estados

Cada cambio manual de estado debe registrarse en:

`log_estados_unidad`

Guardar como mínimo:

- id
- unidad_id
- estado_id
- estado_hasta
- created_at

Esto permitirá posteriormente analizar:

- horarios con mayor oferta;
- horarios con menor oferta;
- duración de disponibilidad;
- frecuencia de actualizaciones;
- comportamiento de los proveedores.

---

# 25. Estado público del servicio

El cliente NO verá el estado individual de todas las unidades.

Debe ver el servicio agregado.

Un servicio está:

**Disponible ahora**

cuando tenga al menos una unidad efectivamente disponible.

Ejemplo:

    Motomandados El Profe

    3 unidades registradas
    2 disponibles

Mostrar:

    ● Disponible ahora
    2 unidades disponibles

---

# 26. Servicios sin disponibilidad

Los servicios sin unidades disponibles pueden seguir apareciendo.

Deben colocarse después de los servicios disponibles.

Mostrar claramente:

**No disponible por el momento**

No permitir que parezca que pueden atender inmediatamente.

Esta regla puede reevaluarse con datos reales.

---

# 27. Orden inicial de resultados

Ordenar aproximadamente por:

1. servicios con disponibilidad actual;
2. cantidad de unidades disponibles;
3. actualización más reciente;
4. rotación para empates.

NO implementar todavía:

- ranking comercial;
- posiciones pagadas;
- reputación;
- estrellas;
- algoritmo complejo.

---

# 28. Modos de contacto

Cada servicio tendrá uno de dos modos.

## Contacto central

Utilizar:

- `dat_servicios.whatsapp`
- `dat_servicios.telefono`

## Contacto por unidad

Seleccionar automáticamente una unidad efectivamente disponible.

Utilizar:

- `dat_unidades.whatsapp`
- `dat_unidades.telefono`

El cliente seguirá viendo únicamente el servicio principal.

NO mostrar públicamente un listado de unidades.

---

# 29. Distribución de contactos por unidad

Cuando existan varias unidades disponibles, evitar enviar todos los
contactos siempre a la primera.

Para MVP utilizar una estrategia sencilla de rotación.

No construir todavía algoritmos complejos.

La implementación debe permitir sustituir posteriormente esta
estrategia por:

- carga de trabajo;
- número de contactos;
- disponibilidad;
- GPS;
- distancia;
- ranking.

---

# 30. WhatsApp

Antes de abrir WhatsApp:

1. determinar servicio;
2. determinar unidad cuando corresponda;
3. determinar precio mostrado;
4. registrar `log_contactos`;
5. abrir WhatsApp.

Mensaje inicial:

    Hola, te encontré en Servicios {ciudad}.

    Vi que tu servicio tiene un precio desde $X.

    ¿Tienes disponibilidad para realizar un mandado?

Sustituir dinámicamente:

- `{ciudad}`
- `$X`

No hardcodear "Servicios Tonalá" dentro de la lógica general.

---

# 31. Llamadas

Debe existir también opción:

**Llamar**

Aplicar la misma lógica de selección:

- contacto central;
- o unidad.

Registrar el contacto antes de iniciar la llamada.

Canales iniciales:

    whatsapp
    llamada

---

# 32. log_contactos

Guardar como mínimo:

- id
- servicio_id
- unidad_id
- ciudad_id
- session_id
- canal
- precio_mostrado
- created_at

`unidad_id` puede ser NULL cuando el servicio utilice contacto
central.

`precio_mostrado` debe conservar el precio que vio el cliente en el
momento del contacto.

---

# 33. Sesión anónima

El cliente NO necesita registrarse.

Crear un `session_id` anónimo.

Utilizar preferentemente una cookie persistente con un UUID aleatorio.

El `session_id` NO representa identidad real.

Debe permitir relacionar eventos básicos como:

    visita
      ↓
    contacto

No implementar fingerprinting avanzado durante el MVP.

---

# 34. log_visitas

Registrar visitas útiles para medición.

Campos mínimos:

- id
- ciudad_id
- session_id
- origen
- created_at

Evitar registrar múltiples visitas innecesarias causadas por cada
render del componente.

Definir el evento de visita de forma consistente.

---

# 35. Métrica principal

La métrica principal del MVP será:

    contactos
    ─────────
     visitas

Conversión:

**visita → contacto**

También medir:

- contactos por servicio;
- contactos por unidad;
- contactos por semana;
- WhatsApp vs llamada;
- unidades disponibles;
- horas con oferta;
- precio mostrado.

---

# 36. Enlace privado de unidad

Cada unidad tendrá acceso mediante un token privado.

Ruta:

    /u/{token}

El token funciona como credencial durante el piloto.

No requiere:

- usuario;
- email;
- contraseña;
- registro.

El token debe ser suficientemente aleatorio.

---

# 37. Seguridad del token

NO guardar el token plano en MySQL.

Guardar:

    SHA-256(token)

en:

    dat_unidades.token_hash

Flujo:

    token URL
       ↓
    SHA-256
       ↓
    buscar token_hash
       ↓
    unidad

Si un enlace se compromete:

1. generar token nuevo;
2. reemplazar `token_hash`;
3. el enlace anterior deja de funcionar.

Nunca escribir tokens privados en logs de aplicación deliberadamente.

---

# 38. Panel privado de unidad

La ruta:

    /u/{token}

debe ser extremadamente sencilla y mobile-first.

Ejemplo:

    Motomandados El Profe

    Unidad 2

    Tu estado

    ● Disponible

    Disponible hasta:
    6:30 PM

    [ Renovar 3 horas ]

    Precio base

    $ [ 45 ]

    [ Guardar precio ]

    Cambiar estado

    [ Estoy disponible ]

    [ Estoy ocupado ]

    [ Ya terminé ]

No convertir esta pantalla en un dashboard complejo.

---

# 39. Diseño público

La referencia visual del proyecto debe seguir un estilo de marketplace
móvil moderno.

Principios:

- Mobile First
- fondo claro;
- tarjetas blancas;
- sombras suaves;
- bordes redondeados;
- espacios amplios;
- interfaz limpia;
- jerarquía tipográfica marcada;
- botones grandes;
- controles cómodos para touch.

---

# 40. Tipografía

Dirección inicial:

- sans-serif;
- geométrica;
- limpia;
- títulos con peso alto;
- textos compactos y legibles.

Primera opción:

**Inter**

La tipografía definitiva puede cambiar durante branding.

No acoplar la arquitectura a una fuente específica.

---

# 41. Iconografía

Utilizar iconografía consistente.

Preferencia inicial:

**Lucide Icons**

Usar iconos lineales/redondeados para:

- menú;
- búsqueda;
- ubicación;
- teléfono;
- seguridad;
- navegación;
- categorías.

Para marcas como WhatsApp utilizar el recurso/icono apropiado.

No mezclar múltiples estilos de iconografía sin necesidad.

---

# 42. Colores

El branding definitivo está pendiente.

Dirección provisional:

- fondo blanco / gris muy claro;
- azul oscuro para títulos;
- verde para disponibilidad;
- verde para acciones de WhatsApp;
- colores adicionales únicamente como acentos.

Existe interés futuro en utilizar una paleta inspirada en las letras
monumentales multicolor de localidades mexicanas/Tonalá.

No convertir todavía esa idea en branding definitivo.

---

# 43. Página principal

La experiencia debe ser dinámica por ciudad.

Ejemplo para Tonalá:

    Servicios Tonalá

    Gente local para tu día a día.

    ¿Necesitas un mandado?

    Conecta con motomandados
    disponibles en Tonalá.

Debe existir una jerarquía visual clara hacia la categoría:

**Mandados**

---

# 44. Arquitectura futura de categorías

Visualmente el producto puede prepararse para categorías futuras.

Ejemplos conceptuales:

    Mandados
    Taxis
    Fletes
    Ver más

Sin embargo:

**SOLO Mandados será funcional en MVP v1.**

No construir todavía:

- taxis;
- fletes;
- oficios;
- otros servicios.

No crear lógica innecesaria para categorías futuras salvo que sea
estrictamente necesaria para no bloquear arquitectura.

---

# 45. Listado público

Título sugerido:

**Motomandados disponibles ahora**

Puede mostrar:

- cantidad de servicios;
- cantidad de unidades disponibles.

Ejemplo:

    5 servicios
    7 unidades disponibles

Los valores deben provenir de datos reales.

---

# 46. Tarjeta de servicio

Cada tarjeta puede mostrar:

- logo opcional;
- nombre;
- descripción breve;
- disponibilidad;
- cantidad de unidades disponibles;
- precio desde;
- cobertura opcional;
- WhatsApp;
- llamada.

Ejemplo:

    [LOGO]

    Motomandados El Profe

    ● Disponible ahora

    2 unidades disponibles

    Desde $40

    Centro, Evolución y alrededores

    [ WhatsApp ] [ Llamar ]

---

# 47. Datos que NO deben mostrarse todavía

No mostrar datos ficticios.

Especialmente:

- estrellas;
- reseñas;
- número de reseñas;
- kilómetros;
- distancia;
- ETA;
- "mejor valorado";
- verificado;
- favoritos;
- posición GPS.

Aunque aparezcan en referencias visuales, NO implementarlos hasta que
existan datos reales y funcionalidad correspondiente.

---

# 48. Mapas y GPS

NO implementar durante MVP v1.

No solicitar ubicación GPS al cliente.

No solicitar GPS continuo al repartidor.

No mostrar:

- mapa;
- pins;
- distancia;
- ETA.

La ubicación en tiempo real pertenece a una fase posterior.

---

# 49. Rutas iniciales

Home:

    /

Ciudad:

    /[ciudad]

Ejemplo:

    /tonala

Servicio:

    /[ciudad]/[servicio]

Ejemplo:

    /tonala/motomandados-el-profe

Unidad privada:

    /u/[token]

No exponer IDs internos en URLs públicas cuando no sea necesario.

---

# 50. Estructura sugerida del proyecto

    src/

      app/

        page.js

        [ciudad]/
          page.js

          [servicio]/
            page.js

        u/
          [token]/
            page.js

        api/

          contactos/
            route.js

          unidades/

            estado/
              route.js

            precio/
              route.js

      components/

        Header.jsx
        ServiceCard.jsx
        ServiceList.jsx
        WhatsAppButton.jsx
        CallButton.jsx
        UnitStatusPanel.jsx
        PriceEditor.jsx

      db/

        index.js
        schema.js

      services/

        servicios.js
        unidades.js
        contactos.js

      lib/

        session.js
        token.js
        whatsapp.js

La estructura puede ajustarse cuando exista una razón técnica clara.

Evitar sobrearquitectura.

---

# 51. Administración

Durante MVP:

**TablePlus será el panel administrativo.**

Desde TablePlus se debe poder:

- crear servicios;
- editar servicios;
- ocultar servicios;
- crear unidades;
- desactivar unidades;
- modificar teléfonos;
- modificar WhatsApp;
- modificar cobertura;
- consultar contactos;
- consultar estados.

NO crear `/admin` todavía.

---

# 52. Seed inicial

Crear datos ficticios para desarrollo.

Ciudad:

    Tonalá

Crear aproximadamente:

    5 servicios

con una combinación de:

- servicios con una unidad;
- servicios con varias unidades;
- contacto central;
- contacto por unidad;
- disponible;
- ocupado;
- no disponible;
- diferentes precios.

Los datos deben identificarse claramente como datos de desarrollo.

NO utilizar datos personales reales.

---

# 53. Lanzamiento piloto

El producto podrá lanzarse inicialmente con:

**5 servicios reales**

No es necesario esperar a tener 10 o 20.

Esto permitirá utilizar el propio producto para ayudar a captar más
proveedores.

Objetivo posterior:

- aumentar servicios;
- aumentar unidades;
- aumentar cobertura horaria.

---

# 54. Criterios iniciales de validación

Observar principalmente:

- visitas;
- contactos;
- conversión visita → contacto;
- contactos por servicio por semana;
- unidades disponibles;
- disponibilidad por hora;
- WhatsApp vs llamada.

No asumir todavía que los objetivos iniciales son definitivos.

Recalibrar con datos reales.

---

# 55. Fuera del alcance del MVP

NO implementar todavía:

- TypeScript;
- aplicación Android;
- aplicación iOS;
- GPS;
- mapas;
- ETA;
- distancia;
- login de clientes;
- cuentas de clientes;
- registro público de proveedores;
- panel administrativo;
- panel completo del servicio;
- pagos online;
- procesamiento de pagos;
- suscripciones automáticas;
- facturación;
- reseñas;
- estrellas;
- favoritos;
- verificación documental;
- badge verificado;
- chat interno;
- notificaciones push;
- WhatsApp Business API;
- SMS;
- OTP;
- fingerprinting avanzado;
- ranking comercial;
- posiciones patrocinadas;
- categorías adicionales funcionales.

---

# 56. Principio de desarrollo

Antes de agregar una funcionalidad preguntar:

> ¿Esta funcionalidad ayuda directamente a conseguir proveedores,
> generar contactos o comprobar que esos contactos tienen valor?

Si la respuesta es no:

**posponerla.**

---

# 57. Prioridades técnicas

Prioridad 1:

    estabilidad

Prioridad 2:

    claridad

Prioridad 3:

    experiencia móvil

Prioridad 4:

    medición

Prioridad 5:

    velocidad de iteración

Evitar optimizaciones prematuras.

---

# 58. Implementación por fases

## Fase técnica 1 — Bootstrap

- crear proyecto Next.js;
- JavaScript;
- Tailwind;
- estructura básica;
- `.env.example`;
- configuración de desarrollo;
- lint/build funcionando.

## Fase técnica 2 — Datos

- Aiven MySQL;
- Drizzle;
- `schema.js`;
- migraciones;
- seeds;
- comprobar tablas desde TablePlus.

## Fase técnica 3 — Landing

- crear ruta dinámica `/[ciudad]`;
- `/` redirige temporalmente a `/tonala`;
- resolver la ciudad por `cat_ciudades.slug`;
- header;
- hero;
- categoría Mandados;
- listado;
- ServiceCard;
- responsive;
- diseño mobile-first.

## Fase técnica 4 — Datos reales de disponibilidad

Sobre la ruta `/[ciudad]` ya existente:

- consultar servicios de la ciudad resuelta por slug;
- disponibilidad efectiva;
- unidades disponibles;
- precio mínimo;
- orden de servicios.

## Fase técnica 5 — Contacto

- WhatsApp;
- llamada;
- session_id;
- log_visitas;
- log_contactos;
- precio mostrado.

## Fase técnica 6 — Repartidor

- `/u/[token]`;
- validación segura del token;
- estado;
- expiración;
- renovación;
- precio base;
- log_estados_unidad.

## Fase técnica 7 — QA

- mobile;
- desktop;
- errores;
- estados vacíos;
- loading;
- accesibilidad básica;
- build de producción;
- revisión de seguridad básica.

## Fase técnica 8 — Piloto

- sustituir seeds por proveedores reales;
- validar teléfonos;
- validar WhatsApp;
- entregar links privados;
- lanzar con mínimo 5 servicios;
- medir comportamiento.

---

# 59. Reglas para Codex / agentes de programación

Antes de realizar cambios:

1. leer este documento completo;
2. inspeccionar el código existente;
3. identificar la fase solicitada;
4. proponer un plan breve;
5. implementar solamente esa fase.

No implementar fases posteriores automáticamente.

No agregar dependencias sin necesidad.

No reemplazar JavaScript por TypeScript.

No introducir servicios externos que no estén aprobados.

No cambiar nombres de tablas o convenciones sin actualizar esta
especificación.

No inventar reglas de negocio.

No crear datos públicos ficticios que puedan interpretarse como
información real.

Después de cada fase:

1. ejecutar lint;
2. ejecutar build;
3. corregir errores;
4. informar archivos modificados;
5. informar migraciones creadas;
6. informar variables de entorno nuevas;
7. indicar cualquier decisión técnica que requiera aprobación.

---

# 60. Variables de entorno

Nunca guardar secretos en Git.

Crear `.env.example`.

Como mínimo se prevé:

    DATABASE_URL=

Pueden agregarse variables adicionales si la implementación de
Aiven/Drizzle las requiere.

`.env.local` debe permanecer ignorado por Git.

Nunca incluir:

- passwords;
- tokens privados;
- credenciales Aiven;
- secretos de producción

en commits.

---

# 61. Definition of Done del MVP técnico

El MVP técnico estará listo para piloto cuando:

- `/tonala` funcione;
- muestre servicios desde MySQL;
- calcule disponibilidad efectiva;
- calcule unidades disponibles;
- calcule "Desde $X";
- permita WhatsApp;
- permita llamada;
- registre contactos;
- registre visitas;
- genere/mantenga session_id anónimo;
- soporte contacto central;
- soporte contacto por unidad;
- `/u/[token]` funcione;
- el repartidor pueda ponerse disponible;
- pueda ponerse ocupado;
- pueda terminar disponibilidad;
- pueda renovar disponibilidad;
- pueda modificar precio;
- los estados expiren correctamente;
- los cambios queden registrados;
- funcione correctamente en móvil;
- exista build de producción sin errores;
- TablePlus permita administrar los datos;
- existan al menos 5 servicios preparados para el piloto.

---

# 62. Objetivo posterior al MVP

Una vez lanzado, no comenzar inmediatamente a desarrollar nuevas
funciones.

Primero obtener evidencia real sobre:

- cuántas personas visitan;
- cuántas contactan;
- qué servicios reciben contactos;
- cuántos contactos terminan en servicios;
- cuánta disponibilidad existe;
- qué horarios tienen demanda;
- qué problemas reportan clientes;
- qué problemas reportan repartidores.

Las siguientes funcionalidades deben decidirse utilizando esos datos.

---

# 63. Resumen

El MVP debe resolver bien una sola pregunta:

> Necesito un motomandado en Tonalá ahora.
> ¿Quién está realmente disponible?

Y permitir completar inmediatamente la siguiente acción:

> Contactarlo.

Todo lo que no contribuya directamente a esas dos cosas puede esperar.