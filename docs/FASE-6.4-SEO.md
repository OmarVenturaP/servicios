# Fase 6.4 — SEO local, descubribilidad, rendimiento y accesibilidad

## Cambios realizados

- Se estableció `https://somosservicios.com` como origen canónico y una redirección permanente desde `www`.
- Se centralizaron metadata de ciudad, nombre geográfico, categorías e indexabilidad.
- `/tonala` ahora publica title, description, canonical, Open Graph y Twitter Card específicos.
- Se incorporaron `CollectionPage`, `ItemList`, `Service`, `WebSite` y `Organization` mediante JSON-LD.
- Se agregó contenido local visible y cinco preguntas frecuentes breves después de la función principal.
- Se corrigió el sitemap para usar ciudades activas, oferta pública real y fechas estables/reales.
- Se agregó una página 404 con identidad de marca y respuesta HTTP 404 real.
- Se corrigieron contraste, semántica ARIA, objetivos táctiles y manejo de foco del menú modal.
- La imagen LCP ahora declara su tamaño de renderizado para evitar solicitar una variante sobredimensionada.

## Arquitectura SEO

### Ciudad

`src/config/seo.js` genera el nombre geográfico y la metadata desde los datos de `cat_ciudades`. Tonalá se interpreta como `Tonalá, Chiapas, México`, sin repetir esa ubicación en componentes reutilizables.

### Categoría

`src/config/service-categories.js` conserva en una sola configuración las categorías visibles, términos de búsqueda y estado funcional. Mandados es la única categoría publicada; las demás siguen siendo presentación marcada como “Próximamente”.

### Metadata y canonical

`generateCityMetadata(city, services)` produce metadata única y canonical absoluto. Los parámetros de consulta no crean otra URL canónica. El dominio preferido es el apex sin `www`.

### Indexabilidad

`isIndexableCity` exige simultáneamente:

- slug incluido explícitamente en mercados publicados;
- ciudad activa resuelta por la consulta pública;
- al menos un servicio visible que no provenga del seed de desarrollo.

`isIndexableCategory` queda preparada para exigir además categoría publicada e indexable. La disponibilidad momentánea no participa en la decisión SEO.

Las búsquedas, filtros, API, `/admin` y `/u/[token]` no generan páginas indexables. Admin y unidad declaran `noindex`; robots desincentiva el rastreo de rutas privadas, sin considerarse un control de seguridad.

### Sitemap

`/sitemap.xml` consulta las ciudades activas y servicios visibles, aplica la política anterior e incluye únicamente URLs canónicas. Las páginas legales y FAQ utilizan fechas editoriales estables. No se usa la fecha de cada deployment.

### Datos estructurados

La raíz declara la plataforma como `Organization` y `WebSite`. La ciudad declara `CollectionPage` e `ItemList`; cada entrada real se representa como `Service` prestado por su propio proveedor. No se afirma que Somos Servicios realice mandados y no se publican teléfonos, tokens, sesiones, ratings, reseñas, coordenadas ni precios fijos.

## Tonalá

- H1 único: “Servicios locales en Tonalá, Chiapas”.
- Title: “Servicios y Mandados en Tonalá, Chiapas | Somos Servicios”.
- Description y Open Graph identifican Tonalá, Chiapas, México.
- Canonical: `https://somosservicios.com/tonala`.
- Contenido complementario explica descubrimiento, contacto directo, cobertura y carácter referencial del precio.

## Mandaditos

El heading y el contenido relacionan de forma natural “mandaditos” con mandados, motomandados, repartidores, compras, entregas y recolecciones. No existe una lista oculta de keywords ni repetición artificial.

No se creó `/tonala/mandados`: con una sola categoría funcional duplicaría el contenido y los proveedores de `/tonala`. La configuración queda preparada para habilitar la ruta cuando exista contenido diferenciado y la categoría sea explícitamente indexable.

## Rendimiento

No existía una medición inicial estable previa a la fase. En las auditorías del build local, la imagen principal fue confirmada como LCP. Se añadió `sizes="272px"`; la oportunidad estimada de ahorro de esa imagen desapareció (antes Lighthouse calculó aproximadamente 28 KiB desperdiciados). Quedó una oportunidad menor de aproximadamente 6 KiB en un logo remoto de Cloudinary.

Las corridas locales presentaron variación importante por CPU/servidor: Performance 49–93, FCP 1.3–3.4 s, LCP 1.9–5.3 s, TBT 270–1770 ms, CLS 0 y Speed Index 1.6–4.8 s. Estos datos son mediciones reales de laboratorio local, no una promesa de producción. Conviene repetir en producción mediante Lighthouse/PageSpeed para obtener una referencia representativa.

Principales factores observados:

1. variación de TTFB hacia la página dinámica y MySQL;
2. evaluación del JavaScript base de Next/React bajo CPU limitada;
3. imagen hero como LCP;
4. hidratación de búsqueda, ordenamiento, contacto y navegación;
5. compresión del logo remoto de Cloudinary.

## Lighthouse

Auditoría móvil completa final del build local:

- Accessibility: 100.
- Best Practices: 100.
- SEO: 100.
- Performance: variable; última auditoría completa 49 y rango observado 49–93.
- CLS: 0.

## Accesibilidad

Corregido:

- contraste de disponibilidad, cantidad de unidades y WhatsApp;
- atributo ARIA inválido en el indicador visual de estado;
- botones de contacto con altura táctil mínima de 44 px;
- foco inicial, trampa de foco, cierre con Escape y retorno del foco en el menú “Más”;
- un único H1 y jerarquía de headings;
- labels del buscador y texto visible de estados.

Pendiente manual: revisar navegación completa con VoiceOver en iOS/macOS y validar contraste sobre dispositivos reales.

## Escalabilidad

### Agregar una ciudad

1. Crear y activar la ciudad en `cat_ciudades` con nombre, slug, estado y país correctos.
2. Publicar al menos un servicio real y visible.
3. Añadir el slug a la política explícita de mercados publicados en `src/config/seo.js` después de revisar contenido.
4. Verificar metadata, canonical, JSON-LD, 404 y sitemap.

### Agregar una categoría

1. Incorporarla en `src/config/service-categories.js` con slug estable y términos naturales.
2. Mantenerla no funcional/no indexable hasta contar con oferta y contenido reales.
3. Crear una ruta propia solo cuando sea útil y diferente de la home de ciudad.
4. Marcarla publicada e indexable después de validar la política de mercado.

## Rutas indexables actuales

- `/tonala`, sujeto a ciudad activa y oferta real visible.
- `/preguntas-frecuentes`.
- `/terminos-condiciones`.
- `/aviso-privacidad`.

`/` redirige a `/tonala` y por ello no se duplica en el sitemap.

## Pendientes manuales

- Verificar el dominio en Google Search Console.
- Enviar `https://somosservicios.com/sitemap.xml`.
- Solicitar indexación inicial de `/tonala` y comprobar canonical elegido por Google.
- Probar la preview de WhatsApp/Facebook con la URL de producción después del despliegue.
- Ejecutar PageSpeed Insights móvil sobre producción, repetir varias veces y revisar datos de campo cuando existan.
- Confirmar en Vercel que `www.somosservicios.com` redirige una sola vez al dominio apex y que HTTP redirige a HTTPS.
- Revisar manualmente móvil, escritorio, teclado y VoiceOver.
