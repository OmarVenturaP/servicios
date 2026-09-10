# Analítica de comportamiento del piloto

## Arquitectura reutilizada

`servicios_session_id` continúa siendo el único identificador anónimo. Por su duración anual funciona como visitante aproximado; cada registro de `log_visitas`, deduplicado durante 30 minutos, representa una visita/sesión aproximada. No se añade fingerprinting ni otro identificador de dispositivo.

`log_visitas` conserva page views; `log_contactos` conserva los intentos de WhatsApp y llamada. `log_eventos_analitica` registra únicamente eventos que antes no existían: impresiones, interacciones, búsquedas y cambios de orden.

## Eventos

- `page_view`: representado por `log_visitas`.
- `service_impression`: 50% de la tarjeta visible durante al menos 600 ms; deduplicado por visitante, ciudad y servicio durante 30 minutos.
- `service_interaction`: pulsación de WhatsApp o llamada, enviada sin bloquear el contacto.
- `whatsapp_click` y `call_click`: representados por `log_contactos.canal`.
- `search`: búsqueda existente de categorías, después de 800 ms.
- `filter_change`: cambio existente entre Recomendados y Menor precio.

No existen mapa ni GPS, por lo que no se crean eventos relacionados.

## Atribución y clasificación

Se guardan parámetros UTM y origen con límites de longitud. Las visitas y contactos nuevos se clasifican como `publico`; una campaña con señal de proveedor/prueba o un dispositivo que abrió válidamente `/u/[token]` se clasifica como `interno`. Los registros históricos permanecen `NULL` y el panel los presenta como `sin_clasificar`.

La señal de proveedor es una cookie HttpOnly booleana con duración de 90 días. No contiene ID de unidad, token ni identidad. El token plano nunca se registra.

## Métricas

El panel conserva visitas, visitantes únicos, contactos, WhatsApp, llamadas y conversión. Agrega sesiones aproximadas, nuevos/recurrentes, impresiones, visitantes expuestos, interacciones, embudo, posición media, tasas sobre exposición, fuentes/campañas y separación público/interno/sin clasificar.

Las tasas sobre exposición utilizan visitantes anónimos únicos para evitar porcentajes artificiales por múltiples clics. Los contactos históricos sin instrumentación nueva no se atribuyen retroactivamente a exposiciones.

## Resiliencia y privacidad

Los eventos de comportamiento usan peticiones independientes y tolerantes a fallos. Un fallo no impide navegar ni iniciar el contacto. No se exponen session IDs en el panel, ni se guardan conversaciones, teléfonos de visitantes, IP, ubicación o datos sensibles.
