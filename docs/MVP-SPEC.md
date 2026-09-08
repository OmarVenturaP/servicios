# Servicios
## Especificación funcional y técnica — MVP v1.0

> Estado: Aprobado para implementación inicial  
> Ciudad piloto: Tonalá, Chiapas, México  
> Arquitectura: Multi-ciudad  
> Plataforma: Web / Mobile First

---

# 1. Propósito del documento

Este documento define el alcance funcional y técnico del MVP de la
plataforma denominada:

**Servicios**

Para la primera implementación:

**Servicios en Tonalá**

La ciudad es contexto del producto y no forma parte de la marca ni del
logotipo.

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

Tipografía oficial:

**Plus Jakarta Sans**

Utilizar Semibold para títulos y wordmark cuando se reproduzca mediante
texto, y Regular/Medium para cuerpo, navegación y etiquetas.

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

La identidad definitiva utiliza:

- verde esmeralda `#34D399`;
- teal `#2ECF9D`;
- azul brillante `#2563EB`;
- azul marino `#0B172A`;
- gradiente principal de 135 grados desde verde esmeralda hacia azul
  brillante.

Mantener los colores de marca separados de los colores semánticos de
disponibilidad, advertencia, error, éxito y canales de contacto.

---

# 43. Página principal

La experiencia debe ser dinámica por ciudad.

Ejemplo para Tonalá:

    Servicios en Tonalá

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

# 51. Administración operativa del MVP

Durante el piloto existirá un panel administrativo mínimo para uso
exclusivo del operador/master de la plataforma.

Ruta inicial:

    /admin

Este panel NO representa todavía un sistema administrativo completo.

Su objetivo es eliminar la dependencia cotidiana de TablePlus para
operaciones sencillas durante el piloto.

El panel permitirá:

- consultar servicios;
- buscar servicios;
- crear servicios;
- editar información básica de servicios;
- consultar unidades pertenecientes a un servicio;
- crear unidades;
- editar información básica de una unidad;
- modificar precio_base;
- modificar estado de una unidad cuando sea necesario;
- generar acceso privado de unidad;
- rotar acceso privado de unidad;
- copiar el enlace generado;
- preparar el enlace para compartir por WhatsApp.

TablePlus seguirá utilizándose para:

- inspección técnica;
- consultas avanzadas;
- correcciones excepcionales;
- revisión directa de logs;
- mantenimiento de base de datos.

No construir todavía:

- usuarios administrativos;
- múltiples roles administrativos;
- permisos granulares;
- recuperación de contraseña;
- OAuth;
- sistema completo de administración.

# 51.1 Acceso administrativo

El panel /admin estará protegido mediante una clave administrativa
definida exclusivamente como variable de entorno.

Ejemplo:

    ADMIN_ACCESS_KEY=

La clave:

- NO debe almacenarse en MySQL;
- NO debe incluirse en código fuente;
- NO debe exponerse al cliente;
- NO debe persistirse en cookies;
- NO debe persistirse en localStorage;
- NO debe persistirse en sessionStorage.

Durante el MVP, el administrador introducirá la clave al acceder al
panel.

La aplicación podrá conservarla únicamente en memoria mientras la
página permanezca abierta.

Si la página se recarga o se cierra, deberá solicitarse nuevamente.

Cada operación administrativa sensible debe validar la credencial en
servidor.

Ocultar componentes en frontend NO constituye autorización.

# 51.2 Administración de servicios con múltiples unidades

Un servicio debe mostrarse una sola vez dentro del panel
administrativo.

Ejemplo:

    Motomandados El Profe
    3 unidades

El operador podrá seleccionar la unidad que desea administrar.

Ejemplo:

    Unidad
    [ Unidad 1 ▼ ]

El cambio de unidad debe permitir consultar y modificar los datos
específicos de esa unidad.

No duplicar visualmente el servicio por cada unidad.

La información se divide conceptualmente en:

Datos del servicio:

- nombre;
- ciudad;
- modo de contacto;
- teléfono central;
- WhatsApp central;
- descripción;
- cobertura;
- visibilidad.

Datos de la unidad:

- nombre;
- teléfono;
- WhatsApp;
- precio_base;
- estado;
- estado_hasta;
- activo;
- estado del acceso privado.

Las operaciones sobre una unidad deben afectar exclusivamente a esa
unidad.

# 51.3 Alta rápida de proveedor

El panel administrativo permitirá crear un proveedor desde una única
pantalla.

Para un proveedor independiente, la operación inicial creará:

    1 dat_servicios
    +
    1 dat_unidades

Datos iniciales:

SERVICIO

- nombre;
- ciudad;
- modo de contacto;
- teléfono;
- WhatsApp;
- cobertura opcional;
- logo opcional.

PRIMERA UNIDAD

- nombre opcional;
- teléfono;
- WhatsApp;
- precio_base.

El logo, cuando sea proporcionado, será almacenado en Cloudinary y
dat_servicios.logo_url conservará únicamente su URL segura.

La imposibilidad temporal de subir el logo no debe impedir el alta del
proveedor.

# 51.3.1 Edición de información del servicio

El administrador podrá modificar:

- nombre;
- modo de contacto;
- teléfono;
- WhatsApp;
- descripción;
- cobertura;
- visibilidad;
- logo.

Para el logo podrá:

- agregar;
- reemplazar;
- eliminar.

Estas operaciones utilizarán Cloudinary.

# 51.4 Gestión de accesos privados

El panel administrativo permitirá generar y rotar el acceso privado de
una unidad.

Flujo de generación:

    generar token criptográficamente seguro
            ↓
    mostrar token/enlace al administrador
            ↓
    calcular SHA-256
            ↓
    guardar únicamente token_hash

El token plano nunca debe almacenarse en MySQL.

Después de generar el acceso se mostrará:

    https://{dominio}/u/{token}

Acciones:

- Copiar enlace
- Compartir por WhatsApp

El token plano debe considerarse recuperable únicamente mientras se
encuentra visible en esa operación.

Si posteriormente se pierde:

    generar acceso nuevo

No intentar recuperar el token anterior desde la base de datos.

Rotar acceso significa:

1. generar token nuevo;
2. sustituir token_hash;
3. invalidar inmediatamente el enlace anterior.

La rotación no debe modificar:

- precio;
- estado;
- teléfono;
- servicio;
- demás información operativa de la unidad.

# 51.5 Compartir acceso por WhatsApp

Después de generar un acceso privado, el panel podrá preparar un
mensaje de WhatsApp.

Ejemplo:

    Hola.

    Este es tu enlace privado para actualizar tu disponibilidad y
    precio en Servicios {ciudad}:

    {url_privada}

    Guárdalo, ya que desde este enlace podrás indicar si estás
    disponible, ocupado o fuera de servicio.

No es necesaria WhatsApp Business API para esta funcionalidad.

Utilizar únicamente una URL de WhatsApp con mensaje prellenado.

# 51.6 Soporte operativo de unidades

El administrador/master podrá modificar manualmente el estado de una
unidad desde /admin.

Esta funcionalidad existe como soporte operativo.

Ejemplos:

- repartidor perdió temporalmente su enlace;
- repartidor solicita que lo marquen como no disponible;
- dueño de flotilla solicita actualizar una unidad;
- problema operativo durante el piloto.

Los estados disponibles serán los mismos definidos para /u/[token]:

- disponible;
- ocupado;
- no_disponible.

Aplicar exactamente las mismas reglas temporales:

Disponible:

    NOW() + 3 horas

Ocupado:

    NOW() + 1 hora

No disponible:

    estado_hasta = NULL

Los cambios administrativos deben generar también un registro en:

    log_estados_unidad

No crear una segunda lógica de disponibilidad para el administrador.
Reutilizar la misma lógica de dominio utilizada por /u/[token].

# 51.7 Logo del servicio y almacenamiento en Cloudinary

Los logos públicos de los servicios serán almacenados en Cloudinary.

Cloudinary será el proveedor de almacenamiento de imágenes utilizado
por el MVP.

Los archivos de imagen NO deben almacenarse:

- dentro de MySQL;
- dentro del repositorio;
- dentro de /public de forma dinámica;
- en almacenamiento temporal de Vercel.

MySQL almacenará únicamente la URL pública/segura entregada por
Cloudinary.

Campo existente:

    dat_servicios.logo_url

Debe almacenar preferentemente:

    secure_url

entregada por Cloudinary.

--------------------------------------------------
51.7.1 Gestión desde /admin
--------------------------------------------------

El panel administrativo permitirá:

- seleccionar un logo;
- mostrar vista previa local antes de subir;
- subir el logo a Cloudinary;
- mostrar el logo actualmente configurado;
- reemplazar el logo;
- eliminar el logo;
- dejar un servicio sin logo.

El logo será opcional.

Si un servicio no tiene logo, la aplicación utilizará el ícono/fallback
visual predeterminado.

--------------------------------------------------
51.7.2 Formatos permitidos
--------------------------------------------------

Aceptar inicialmente:

- JPG
- JPEG
- PNG
- WEBP

Validar tipo de archivo tanto como sea razonablemente posible.

Aplicar un límite de tamaño apropiado para logos.

Valor inicial recomendado para el MVP:

    máximo 3 MB

No permitir archivos arbitrarios.

--------------------------------------------------
51.7.3 Organización en Cloudinary
--------------------------------------------------

Los logos deberán mantenerse organizados en Cloudinary.

Utilizar una estructura predecible, por ejemplo:

    servicios/{servicio_id}/logo

El identificador del servicio debe utilizarse para evitar colisiones
entre servicios con nombres similares.

Ejemplo conceptual:

    servicios/27/logo

No utilizar como identificador único solamente el nombre visible del
servicio.

Siempre que sea posible, utilizar un public_id determinístico para el
logo de cada servicio.

Esto permite reemplazar o eliminar el archivo sin necesitar una segunda
tabla de archivos.

--------------------------------------------------
51.7.4 Reemplazo de logo
--------------------------------------------------

Un servicio tendrá como máximo un logo principal durante el MVP.

Cuando el administrador reemplace un logo:

1. validar el nuevo archivo;
2. subir/reemplazar el recurso correspondiente en Cloudinary;
3. obtener el nuevo secure_url;
4. actualizar dat_servicios.logo_url;
5. reflejar el cambio en la landing.

No crear acumulaciones innecesarias de logos antiguos cuando el modelo
de public_id utilizado permita sobrescribir el recurso existente.

Un fallo en la actualización del logo NO debe corromper los demás datos
del servicio.

--------------------------------------------------
51.7.5 Eliminación de logo
--------------------------------------------------

La acción:

    Eliminar logo

debe:

1. eliminar o invalidar el recurso correspondiente en Cloudinary cuando
   sea posible;
2. establecer:

       dat_servicios.logo_url = NULL

3. provocar que la landing vuelva automáticamente al fallback visual.

La eliminación del logo NO debe eliminar el servicio.

--------------------------------------------------
51.7.6 Landing pública
--------------------------------------------------

Las tarjetas públicas de servicios utilizarán:

    dat_servicios.logo_url

Lógica:

    si logo_url existe:
        mostrar imagen del servicio

    si logo_url es NULL:
        mostrar fallback predeterminado

Si una imagen externa falla al cargar, la tarjeta NO debe romperse.

Debe mostrarse un fallback apropiado.

Todos los logos deben mostrarse dentro de un contenedor de dimensiones
visuales consistentes.

Usar object-fit apropiado para evitar deformaciones.

No asumir que todos los proveedores entregarán logos con la misma
proporción.

--------------------------------------------------
51.7.7 Optimización
--------------------------------------------------

Aprovechar las capacidades de Cloudinary para servir imágenes
optimizadas cuando sea razonablemente sencillo.

El objetivo es evitar descargar archivos originales innecesariamente
grandes en la landing.

No implementar en esta fase un sistema avanzado de procesamiento de
imágenes.

Las transformaciones utilizadas deben estar orientadas únicamente a:

- tamaño apropiado;
- calidad web;
- formato eficiente cuando aplique.

--------------------------------------------------
51.7.8 Seguridad de Cloudinary
--------------------------------------------------

Las credenciales administrativas de Cloudinary deben existir
exclusivamente como variables de entorno del servidor.

Nunca exponer al navegador:

    CLOUDINARY_API_SECRET

Nunca incluir secretos de Cloudinary en:

- repositorio;
- código cliente;
- URLs públicas;
- logs;
- respuestas API.

Las operaciones que requieran privilegios de Cloudinary deben
realizarse o autorizarse desde servidor.

No implementar uploads públicos sin protección solamente para
simplificar la funcionalidad.

El endpoint administrativo de upload debe estar protegido por la misma
autorización de /admin.

--------------------------------------------------
51.7.9 Variables de entorno
--------------------------------------------------

Documentar en:

    .env.example

las variables necesarias para Cloudinary.

Ejemplo conceptual:

    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=

No incluir valores reales.

Si la implementación existente utiliza CLOUDINARY_URL como
configuración equivalente, mantener una única estrategia consistente.

No introducir dos métodos distintos de configuración sin necesidad.

--------------------------------------------------
51.7.10 Fallos de Cloudinary
--------------------------------------------------

Cloudinary es un servicio externo y sus errores deben manejarse
explícitamente.

Si una subida falla:

- informar al administrador;
- no guardar una URL inválida;
- no romper el servicio;
- permitir volver a intentar.

Si se está creando un proveedor nuevo y falla únicamente la subida del
logo, el proveedor puede permanecer creado sin logo.

El logo NO debe ser requisito para completar el alta de un servicio.

La aplicación utilizará el fallback hasta que pueda subirse
correctamente.

**TablePlus continuará como herramienta administrativa técnica complementaria.**

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
- panel administrativo completo;
- usuarios y roles administrativos;
- panel de flotilla para proveedores;
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

## Fase técnica 6.1 — Administración operativa mínima

- `/admin` protegido mediante `ADMIN_ACCESS_KEY`;
- alta y edición operativa de servicios y unidades;
- soporte administrativo de estados reutilizando la lógica de Fase 6;
- generación y rotación de accesos privados de unidad;
- copia y preparación de enlaces para compartir por WhatsApp.

## Fase técnica 6.2 — Navegación y ordenamiento

- búsqueda sencilla de tipos de servicio;
- categorías futuras identificadas como Próximamente;
- contador de disponibilidad efectiva;
- orden Recomendados y Menor precio.

## Fase técnica 6.3 — Identidad, dominio y base legal

- identidad oficial Servicios;
- assets de marca y Plus Jakarta Sans;
- dominio canónico `https://somosservicios.com`;
- metadata social, robots, sitemap y manifest;
- Términos y Condiciones;
- Aviso de Privacidad.

## Fase técnica 6.4 — Panel administrativo de métricas

- `/admin/metricas` protegido mediante `ADMIN_ACCESS_KEY`;
- periodos Hoy, 7 días y 30 días;
- visitas y visitantes anónimos únicos aproximados;
- contactos iniciados, WhatsApp, llamadas y tasa de contacto;
- agregados por servicio, unidad y ciudad;
- evolución diaria;
- sin exponer identificadores de sesión ni datos de contacto;
- sin borrado de métricas desde la interfaz.

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

# 64. Roadmap — Acceso de administrador de servicio / flotilla

La arquitectura debe contemplar una evolución futura para servicios
con múltiples unidades.

Durante MVP v1:

    /u/{token}

controla exclusivamente una unidad.

El operador/master puede administrar todas las unidades mediante:

    /admin

No construir todavía un panel de flotilla para el proveedor.

Si durante el piloto se valida que servicios con tres o más unidades
necesitan administración centralizada, incorporar posteriormente:

    /s/{token}

donde "s" representa un acceso privado del servicio.

Este acceso será distinto del acceso master /admin.

Objetivo:

Permitir que el responsable de un servicio administre únicamente su
propia flotilla.

Ejemplo:

    Motomandados El Profe

    3 de 5 disponibles

    Unidad 1     Disponible
    Unidad 2     Disponible
    Unidad 3     Ocupado
    Unidad 4     No disponible
    Unidad 5     Disponible

Acciones futuras:

- cambiar estado de una unidad;
- activar varias unidades;
- desactivar varias unidades;
- modificar precios;
- consultar disponibilidad general;
- agregar o administrar unidades si el modelo comercial lo permite.

No debe permitir:

- administrar otros servicios;
- acceder a configuración master;
- consultar información privada de otros proveedores.

El acceso de servicio deberá utilizar un token/credencial diferente
al token de las unidades.

No reutilizar un token de unidad para conceder privilegios de flotilla.

La decisión de implementar esta funcionalidad deberá basarse en datos
del piloto, particularmente:

- cantidad de servicios con múltiples unidades;
- cantidad promedio de unidades por servicio;
- frecuencia con la que un responsable administra varias unidades;
- dificultad real de mantener estados por repartidor.

# 65. Experiencia pública — navegación, búsqueda y ordenamiento

La landing pública debe comunicar desde el MVP que Servicios {ciudad}
es una plataforma de servicios locales y NO una aplicación exclusiva
de motomandados.

Durante el piloto, Mandados será la única categoría completamente
funcional.

La interfaz podrá mostrar otros tipos de servicio como parte de la
visión futura de la plataforma, siempre identificándolos claramente
como "Próximamente".

El objetivo de esta sección es definir:

- el propósito del bloque "¿Qué necesitas?";
- el comportamiento del buscador principal;
- la separación entre categorías y proveedores;
- la información de disponibilidad mostrada al cliente;
- el ordenamiento del listado de Mandados;
- el comportamiento de "Recomendados";
- el comportamiento de "Menor precio";
- el tratamiento de categorías futuras;
- la evolución posterior hacia una plataforma multicategoría.


## 65.1 Bloque "¿Qué necesitas?"

La landing debe conservar de forma visible un bloque principal:

    ¿Qué necesitas?

Este bloque tiene una función tanto operativa como de comunicación del
producto.

Debe permitir que el usuario entienda desde el piloto que Servicios
{ciudad} está diseñado para ofrecer diferentes tipos de servicios
locales y que Mandados representa únicamente la primera categoría
funcional.

Ejemplo conceptual:

    ¿Qué necesitas?

    [ Buscar servicios... ]

    [ Mandados ]
    [ Fletes · Próximamente ]
    [ Taxis · Próximamente ]

Mandados estará activo durante el MVP.

Las demás categorías visibles deberán identificarse claramente como:

    Próximamente

mientras no exista funcionalidad real para ellas.

No presentar una categoría futura como disponible si todavía no existe
un flujo funcional para utilizarla.

El bloque "¿Qué necesitas?" debe permanecer visible incluso mientras
Mandados sea la única categoría funcional, ya que ayuda a comunicar la
visión multicategoría de Servicios {ciudad}.


## 65.2 Buscador principal

El input:

    Buscar servicios...

representa una búsqueda de TIPOS o CATEGORÍAS DE SERVICIO.

NO representa una búsqueda de proveedores individuales.

Ejemplos:

    "mandado"
        → Mandados

    "flete"
        → Fletes · Próximamente

    "taxi"
        → Taxis · Próximamente

El objetivo es ayudar al usuario a identificar qué tipo de servicio
necesita.

Durante esta etapa, el buscador puede funcionar como un filtro sencillo
sobre las categorías visibles.

No es necesario consultar MySQL para cada búsqueda si las categorías
futuras todavía forman parte únicamente de la presentación de la
landing.

No implementar todavía:

- búsqueda full-text;
- motor externo de búsqueda;
- autocomplete remoto;
- búsquedas geográficas;
- búsqueda semántica;
- búsqueda por descripción de proveedores.


## 65.3 Búsquedas sin resultados

Si el usuario introduce un tipo de servicio que todavía no está
contemplado, por ejemplo:

    plomero

y no existe una categoría correspondiente, mostrar una respuesta
sencilla equivalente a:

    No encontramos ese servicio por ahora.

No inventar resultados.

No redirigir automáticamente búsquedas desconocidas hacia Mandados.

No presentar una categoría inexistente como "Próximamente" a menos que
esa categoría forme realmente parte de las categorías futuras definidas
por la aplicación.

El estado vacío debe permitir que el usuario vuelva fácilmente a ver
las categorías disponibles.


## 65.4 Separación entre categorías y proveedores

La experiencia pública debe mantener claramente separados dos niveles.

NIVEL 1 — TIPO DE SERVICIO

El bloque:

    ¿Qué necesitas?

permite descubrir o buscar categorías.

Ejemplos:

    Mandados
    Fletes
    Taxis

NIVEL 2 — PROVEEDORES

Una vez dentro de una categoría funcional, se muestran los proveedores
que pueden prestar ese servicio.

Ejemplos dentro de Mandados:

    Motomandados Demo Centro
    Mandadito Mía
    Motomandados La Curva

El buscador principal pertenece al NIVEL 1.

Durante el MVP NO utilizar el buscador principal para filtrar por:

- nombre del proveedor;
- nombre de la empresa;
- nombre de la unidad;
- nombre del repartidor.

Ejemplo:

Buscar:

    "Motomandados La Curva"

NO debe considerarse el propósito principal del buscador:

    Buscar servicios...

Si en el futuro el volumen de proveedores justifica una búsqueda por
nombre, deberá implementarse como una funcionalidad independiente.


## 65.5 Listado de Mandados

Durante el piloto:

    /[ciudad]

puede continuar mostrando directamente el listado completo de
proveedores de Mandados.

Ejemplo actual:

    /tonala

No es necesario crear todavía:

    /tonala/mandados

Mientras Mandados sea la única categoría funcional, introducir una
segunda ruta únicamente agregaría navegación sin aportar suficiente
valor.

La landing puede contener:

    Servicios en Tonalá

    ¿Qué necesitas?

    [ Buscar servicios... ]

    Categorías

    Mandados
    Fletes · Próximamente
    Taxis · Próximamente

    Mandados disponibles ahora

    [ Recomendados ] [ Menor precio ]

    [ proveedor ]
    [ proveedor ]
    [ proveedor ]


## 65.6 Información de disponibilidad

La landing debe priorizar información útil para el cliente.

Evitar utilizar como métrica principal la cantidad total de servicios
registrados en la plataforma, ya que puede incluir proveedores que no
están disponibles en ese momento.

En lugar de:

    6 servicios · 4 unidades disponibles

preferir una comunicación equivalente a:

    4 repartidores disponibles ahora

o, si la terminología de la interfaz lo requiere:

    4 unidades disponibles ahora

La cifra debe representar la suma REAL de unidades efectivamente
disponibles.

No contar:

- unidades ocupadas;
- unidades en estado no_disponible;
- unidades cuya disponibilidad haya vencido;
- unidades inactivas;
- unidades pertenecientes a servicios que no deban mostrarse
  públicamente.

La disponibilidad efectiva debe utilizar exactamente las mismas reglas
de negocio definidas para el resto del MVP.

No crear una segunda lógica de disponibilidad exclusivamente para la
landing.


## 65.7 Control de ordenamiento

El listado de proveedores de Mandados tendrá dos modos de ordenamiento
visibles:

    [ Recomendados ] [ Menor precio ]

El modo predeterminado será:

    Recomendados

El control debe ser sencillo y apropiado para dispositivos móviles.

Puede implementarse mediante:

- chips;
- botones;
- segmented control;
- otro control equivalente.

Con solamente dos opciones no es necesario utilizar un select
desplegable.

Debe quedar visualmente claro cuál de las dos opciones está
seleccionada.

El estado seleccionado no debe depender exclusivamente del color.


## 65.8 Orden "Recomendados"

"Recomendados" representa el orden predeterminado del listado.

Durante el MVP, "Recomendados" NO significa:

- mejor valorado;
- mayor número de reseñas;
- proveedor verificado;
- proveedor patrocinado;
- proveedor que pagó por posicionamiento;
- selección editorial;
- mayor precio;
- menor precio;
- cercanía geográfica.

El orden representa principalmente la capacidad real del servicio para
atender al cliente en ese momento.

Reglas:

1. Los servicios con al menos una unidad efectivamente disponible
   aparecen antes que los servicios sin disponibilidad.

2. Entre los servicios disponibles, priorizar aquellos con mayor
   cantidad de unidades efectivamente disponibles.

3. Como siguiente criterio, priorizar la disponibilidad actualizada más
   recientemente.

4. En condiciones equivalentes puede utilizarse el mecanismo de
   rotación/desempate existente para evitar favorecer permanentemente
   al mismo servicio.

5. Los servicios sin disponibilidad efectiva aparecerán después de los
   servicios disponibles cuando la landing decida mantenerlos visibles.

6. El precio NO participa en el orden "Recomendados".

Ejemplo:

    Servicio A
    2 unidades disponibles
    Desde $50

    Servicio B
    1 unidad disponible
    Desde $30

En "Recomendados", el Servicio A puede aparecer primero debido a que
tiene mayor capacidad disponible.

El hecho de que su precio sea mayor NO es la razón de su posición.


## 65.9 Orden "Menor precio"

Cuando el usuario seleccione:

    Menor precio

los servicios deberán ordenarse priorizando primero la disponibilidad y
posteriormente el precio.

Reglas:

1. Servicios con disponibilidad efectiva antes que servicios sin
   disponibilidad.

2. Entre los servicios disponibles:

       precio_desde ASC

3. Si dos servicios tienen el mismo precio_desde, utilizar como
   desempate:

       mayor cantidad de unidades disponibles

4. Como siguiente desempate:

       disponibilidad actualizada más recientemente

5. Los servicios sin disponibilidad permanecerán después de los
   disponibles.

Un servicio NO disponible nunca debe aparecer antes que un servicio
disponible únicamente por tener un precio histórico inferior.


## 65.10 Cálculo de "Desde $X"

El orden "Menor precio" debe utilizar exactamente el mismo
precio_desde mostrado en la tarjeta pública.

precio_desde corresponde a:

    MIN(precio_base)

exclusivamente entre las unidades EFECTIVAMENTE DISPONIBLES del
servicio.

Ejemplo:

    Unidad 1
    Disponible
    $40

    Unidad 2
    Ocupado
    $25

Resultado:

    Desde $40

NO:

    Desde $25

Otro ejemplo:

    Unidad 1
    Disponible pero estado_hasta vencido
    $20

    Unidad 2
    Disponible y vigente
    $45

Resultado:

    Desde $45

Las unidades:

- ocupadas;
- no disponibles;
- vencidas;
- inactivas;

NO deben modificar precio_desde.

Esta regla debe ser compartida por:

- tarjeta pública;
- orden "Menor precio";
- mensaje de contacto;
- demás funcionalidades que utilicen precio_desde.

No duplicar el cálculo con implementaciones diferentes.


## 65.11 Servicios sin disponibilidad

Los servicios sin disponibilidad efectiva pueden continuar visibles
durante el piloto, pero siempre deberán aparecer después de los
servicios disponibles.

Esto aplica tanto para:

    Recomendados

como para:

    Menor precio

Un proveedor no disponible no debe adelantarse a un proveedor
disponible debido a:

- precio;
- nombre;
- orden de creación;
- ID;
- cualquier otro criterio secundario.

La interfaz debe comunicar claramente que el servicio no está
disponible en ese momento.

Si no existe un precio_desde efectivo porque no existe ninguna unidad
disponible, no inventar un precio público utilizando unidades no
disponibles únicamente para poder ordenar la tarjeta.

Mantener el tratamiento definido por las reglas generales del MVP para
servicios sin disponibilidad.


## 65.12 Estado del ordenamiento

La selección:

    Recomendados
    Menor precio

es únicamente una preferencia temporal de presentación.

Durante el MVP no debe almacenarse en:

- MySQL;
- cookies;
- localStorage;
- sessionStorage;
- session_id;
- perfil de usuario.

No existe una cuenta de cliente asociada a esta preferencia.

Al cargar o recargar la landing, el orden predeterminado debe volver a:

    Recomendados

Cambiar entre ambos modos no debe realizar escrituras en base de datos.

Cuando los datos necesarios ya se encuentran disponibles en la página,
el cambio de orden debe realizarse sin consultas innecesarias al
servidor.


## 65.13 Eliminación de "Ver todos"

Durante el piloto eliminar:

    Ver todos

del encabezado del listado de Mandados cuando el listado ya representa
todos los proveedores correspondientes.

No mantener controles únicamente como decoración.

No crear una ruta nueva solamente para justificar la existencia de:

    Ver todos

Durante la configuración actual:

    /tonala

ya presenta directamente el listado de Mandados.

Por lo tanto, "Ver todos" no proporciona una acción adicional útil.


## 65.14 Uso futuro de "Ver todos"

"Ver todos" podrá reincorporarse cuando exista más de una categoría
funcional y /[ciudad] evolucione hacia una verdadera home/directorio.

Ejemplo futuro:

    Servicios en Tonalá

    Mandados disponibles                  Ver todos →
    [ proveedor ]
    [ proveedor ]
    [ proveedor ]

    Fletes disponibles                    Ver todos →
    [ proveedor ]
    [ proveedor ]
    [ proveedor ]

En ese escenario, la home podrá mostrar únicamente una muestra de cada
categoría.

Entonces:

    Ver todos → Mandados

podrá conducir a:

    /tonala/mandados

y:

    Ver todos → Fletes

podrá conducir a:

    /tonala/fletes

Esta funcionalidad NO debe implementarse mientras Mandados sea la única
categoría funcional.


## 65.15 Categorías futuras

La arquitectura visual debe comunicar que Servicios {ciudad} está
preparado para evolucionar hacia diferentes categorías.

Ejemplos conceptuales:

    Mandados
    Fletes
    Taxis
    Plomería
    Electricidad

La presencia de una categoría en la interfaz NO significa que deba
implementarse funcionalmente durante el piloto.

Durante el MVP:

    Mandados = funcional

Las demás categorías que se decida mostrar deben identificarse como:

    Próximamente

No crear proveedores ficticios para aparentar disponibilidad.

No crear páginas vacías únicamente para categorías futuras.

No permitir acciones de contacto para categorías que todavía no estén
operativas.

La lista definitiva de categorías futuras no queda cerrada por esta
sección.

Las categorías podrán definirse posteriormente según validación del
mercado y necesidades locales.


## 65.16 Evolución futura de navegación

Cuando exista al menos una segunda categoría funcional, deberá
evaluarse la evolución de la navegación.

Arquitectura conceptual futura:

    /tonala
        → home/directorio de la ciudad

    /tonala/mandados
        → listado de proveedores de Mandados

    /tonala/fletes
        → listado de proveedores de Fletes

    /tonala/taxis
        → listado de proveedores de Taxis

Posteriormente, si las fichas individuales lo requieren:

    /tonala/mandados/{servicio}

    /tonala/fletes/{servicio}

La estructura definitiva deberá diseñarse cuando se implemente la
segunda categoría funcional.

NO realizar esta migración durante la Fase 6.2.


## 65.17 Evolución futura del buscador

Cuando existan múltiples categorías funcionales, el buscador principal
podrá evolucionar para consultar un catálogo real de tipos de servicio.

En ese momento podrá evaluarse:

- catálogo persistente de categorías;
- aliases/sinónimos;
- búsqueda por palabras clave;
- autocomplete;
- rutas por categoría;
- sugerencias de servicios.

Ejemplo futuro:

    "mudanza"
        → Fletes / Mudanzas

    "llevar paquete"
        → Mandados

    "taxi"
        → Taxis

Estas capacidades NO forman parte de la Fase 6.2.

No introducir una arquitectura compleja únicamente para anticipar esta
funcionalidad.


## 65.18 Búsqueda futura de proveedores

La búsqueda de proveedores es conceptualmente distinta de la búsqueda
de tipos de servicio.

Durante el MVP no es necesaria debido al volumen reducido de
proveedores.

Si en el futuro una categoría contiene suficientes proveedores para
justificarlo, podrá incorporarse dentro del listado correspondiente un
control independiente:

    Buscar proveedor...

Este buscador podrá filtrar:

- nombre del servicio;
- eventualmente descripción;
- otros atributos públicos relevantes.

No mezclar esta funcionalidad con:

    ¿Qué necesitas?
    Buscar servicios...

El primer buscador responde:

    ¿Qué tipo de servicio necesitas?

El segundo, si algún día existe, responderá:

    ¿Qué proveedor estás buscando?


## 65.19 Principios de experiencia de usuario

La landing debe priorizar decisiones simples para el cliente.

El usuario que necesita un mandado debe poder comprender rápidamente:

1. que Mandados está disponible;
2. cuántos repartidores/unidades están disponibles;
3. qué proveedores pueden atenderlo;
4. desde qué precio ofrecen el servicio;
5. cómo contactarlos.

La expansión futura de la plataforma debe comunicarse sin interferir
con este flujo principal.

Evitar controles sin funcionalidad.

Evitar filtros que no aporten una decisión real.

Evitar métricas internas que no sean útiles para el cliente.

Evitar presentar funcionalidades futuras como si ya estuvieran
disponibles.


## 65.20 Fuera del alcance de la Fase 6.2

No implementar durante esta fase:

- nuevas categorías funcionales;
- proveedores ficticios para categorías futuras;
- rutas /[ciudad]/mandados;
- rutas /[ciudad]/fletes;
- rutas /[ciudad]/taxis;
- buscador de proveedores;
- búsqueda full-text;
- autocomplete remoto;
- catálogo complejo de categorías;
- filtros por colonia;
- filtros por distancia;
- geolocalización;
- GPS;
- mapas;
- reseñas;
- estrellas;
- "Mejor valorados";
- "Más cercanos";
- ranking comercial;
- posicionamiento pagado;
- servicios patrocinados;
- recomendaciones personalizadas;
- persistencia de preferencias de ordenamiento;
- cambios al sistema administrativo;
- cambios al sistema de tokens;
- cambios al panel privado de unidades.


## 65.21 Criterios de aceptación de la Fase 6.2

La Fase 6.2 se considerará funcionalmente completa cuando:

1. /tonala continúe funcionando correctamente.

2. El bloque "¿Qué necesitas?" permanezca visible.

3. El input "Buscar servicios..." permanezca visible y represente
   categorías/tipos de servicio.

4. Mandados se identifique como categoría funcional.

5. Las categorías futuras visibles se identifiquen claramente como
   "Próximamente".

6. Una búsqueda correspondiente a Mandados pueda identificar la
   categoría Mandados.

7. Una búsqueda correspondiente a una categoría futura visible pueda
   identificarla como "Próximamente".

8. Una búsqueda desconocida muestre un estado vacío comprensible.

9. El buscador principal NO filtre proveedores por nombre.

10. El texto/control "Ver todos" haya sido eliminado del listado actual
    de Mandados.

11. La landing no utilice como métrica principal la cantidad total de
    servicios registrados.

12. El contador de disponibilidad utilice exclusivamente unidades
    efectivamente disponibles.

13. Exista el control:

        Recomendados | Menor precio

14. "Recomendados" sea la opción predeterminada.

15. "Recomendados" priorice servicios con mayor disponibilidad según
    las reglas definidas.

16. El precio no influya en "Recomendados".

17. "Menor precio" ordene los servicios disponibles utilizando
    precio_desde ascendente.

18. precio_desde considere exclusivamente unidades efectivamente
    disponibles.

19. Servicios no disponibles permanezcan después de los disponibles en
    ambos modos.

20. Cambiar el orden no escriba preferencias en base de datos.

21. Recargar la página vuelva a "Recomendados".

22. WhatsApp continúe funcionando.

23. Llamar continúe funcionando.

24. La medición de contactos existente continúe funcionando.

25. /u/[token] continúe funcionando.

26. /admin continúe funcionando.

27. La experiencia sea utilizable correctamente en móvil.

28. La experiencia continúe funcionando correctamente en desktop.

29. No sea necesaria ninguna migración de base de datos para completar
    esta fase.

30. No se introduzcan funcionalidades fuera del alcance establecido.
