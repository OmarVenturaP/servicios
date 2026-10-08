# Publicidad local

## Instalación

Ejecutar `docs/sql/instalar-publicidad.sql` en MySQL, dentro de la base de datos
de Servicios. Crea `dat_anuncios` y registra los dos anuncios recibidos para
Tonalá, activos y sin límite de vigencia. No ejecutamos ese archivo desde Codex.
Al final muestra los registros para verificar la carga. Si Tonalá no existe o
está inactiva, no inserta anuncios: revisar `cat_ciudades` antes de continuar.

Para crear solo la tabla, usar `docs/sql/crear-publicidad.sql`.
Ambos usan el mismo DDL que `drizzle/0009_sloppy_yellowjacket.sql`, con la llave
foránea a ciudades y el índice de ciudad, activo y orden. El `IF NOT EXISTS`
permite que Drizzle registre posteriormente la migración sin intentar volver
a crear una tabla ya instalada con este script. No reconcilia tablas creadas
con otra estructura; no modificar manualmente la tabla ni el historial Drizzle.
Las migraciones anteriores del proyecto conservan su estado y deben revisarse
por separado antes de ejecutar todas las migraciones pendientes.

## Imágenes y destinos iniciales

Las dos imágenes originales fueron cargadas en Cloudinary, sin recortarlas:

- Servitec: `banner_publicidad_servitec.jpeg` →
  https://www.servitec-tonala.es/promociones/sitio-web-999
- Servicios: `banner_publicidad_somos_servicios.jpeg` (versión final recibida) →
  WhatsApp configurado en la app para «Quiero publicar mi servicio», con su
  mensaje prellenado. El enlace quedó copiado en el anuncio; futuros cambios
  del WhatsApp general no reescriben automáticamente anuncios existentes.

Las URL públicas exactas están en el script de instalación. La versión anterior
`banner_publicidad_servicios.jpeg` no se utiliza.

## Uso

En `/admin`, entrar a **Administrar publicidad**, o visitar `/admin/publicidad`.
Usar la clave administrativa existente. Seleccionar ciudad, crear o editar un
anuncio, elegir una imagen local, título descriptivo y URL HTTPS de destino.
WhatsApp utiliza `https://wa.me/` seguido del teléfono internacional, sin +,
espacios ni guiones. El texto prellenado opcional va en `?text=...`.

Se admiten imágenes estáticas JPG, PNG o WebP de hasta 3 MB, proporción 5:1
(con tolerancia al redondeo de un píxel, como 1024 × 205). Recomendado:
1200 × 240 px y menos de 150 KB. Las imágenes se guardan en Cloudinary, no en
MySQL. Al editar sin seleccionar imagen, se conserva la existente. Las imágenes
anteriores se conservan en Cloudinary al reemplazarlas; ocultar un anuncio no
borra la imagen ni su registro.

El orden es ascendente con desempate por id. «Anuncio activo» habilita su
publicación. Inicio y fin son opcionales y comprenden días completos inclusivos
en la zona horaria de la ciudad. Sin fechas no hay límite de vigencia.

El carrusel se ubica debajo de «Próximamente más servicios». No aparece cuando
no hay anuncios; con uno queda fijo y con varios rota cada seis segundos.
Solo se pausa con el botón Pausar o mientras la pestaña está oculta; cursor,
foco, toque y desplazamiento manual no detienen la rotación. Los indicadores
permiten selección manual. También se puede deslizar horizontalmente con el
dedo o trackpad, o usar las flechas izquierda/derecha al enfocar el carrusel.
Cada desplazamiento se ajusta a un banner completo y actualiza los indicadores.
Deslizar no abre el enlace; tocar el banner sin arrastrarlo sí.
El desplazamiento es circular: avanzar desde el último lleva al primero y
retroceder desde el primero lleva al último. Las copias visuales de los extremos
no crean registros, indicadores ni elementos adicionales de navegación por teclado. Con movimiento reducido se desactiva la rotación
automática y las transiciones. Las imágenes fallidas se excluyen del carrusel.
Los enlaces abren otra pestaña; no se registran como contactos de proveedores.
La vigencia y el estado se consultan al cargar la página (no hay actualización
en vivo de una página que permanece abierta).

## Revisión manual

Después de ejecutar el SQL y publicar el código:

1. Abrir `/tonala`: ambos banners completos, sin recorte, entre categorías y proveedores.
2. Comprobar cambio a los seis segundos, pausa y selección por indicadores.
3. Verificar ambos enlaces y el mensaje de WhatsApp.
4. Entrar a `/admin/publicidad`, editar orden o vigencia y refrescar la landing.
5. Ocultar uno: banner fijo. Ocultar ambos: sin espacio publicitario.
6. Comprobar teclado, móvil y preferencia de movimiento reducido.

No se añaden dependencias ni variables de entorno. Se reutilizan
`ADMIN_ACCESS_KEY` y las credenciales de Cloudinary existentes. No hay envío
de mensajes de WhatsApp automático: el visitante decide si los envía.
