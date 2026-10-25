# Pruebas de Momo · 25 de octubre de 2026

**Quién probó:** Claude, con la cuenta de pruebas `pruebas.momo@example.com` en la empresa **"Momo Pruebas (copia de DTO)"**. Esta empresa tiene los mismos 221 productos, las 15 políticas y la misma personalidad que De Todito Outlet. Las pruebas no tocan los datos reales de DTO.

**Cómo:** se usó la pantalla **Entrenar a Momo** en formato celular (390 × 844), escribiendo como un cliente real. El cerebro de Momo fue **Gemini (versión gratis)**.

**Se hicieron 3 rondas** con las mismas 8 situaciones típicas de Marketplace. Entre ronda y ronda se corrigió lo que falló.

---

## Resumen

| | Ronda 1 | Ronda 2 | Ronda 3 |
|---|---|---|---|
| Mensajes enviados | 14 | 14 | 15 |
| Tiempo promedio de respuesta | **1,7 s** | 2,3 s | **2,1 s** |
| Respuesta más lenta | 3,4 s | 4,4 s | 3,2 s |
| Respuestas correctas según las políticas | 9 de 14 | 11 de 14 | **13 de 15** |
| Cosas inventadas | 3 | 1 | **0** |
| Dudas anotadas en vez de inventar | 1 | 4 | 4 |
| Fotos de referencia enviadas | 0 | 0 | ✅ (corregido después de la ronda 3) |
| Errores por saturación de Gemini | 0 | 1 | 0 |

**Conclusión:** Momo responde en unos 2 segundos, usa los precios reales del catálogo y aplica bien las políticas de despacho, plazos y proyectos a medida. Tras las correcciones **dejó de inventar**: lo que no sabe lo anota como duda. Ahora también envía fotos y recuerda las respuestas aprobadas.

---

## ✅ Lo positivo

1. **Precios reales:** clóset 3 puertas con 4 cajones a $134.990 y con 8 cajones a $149.990, y cómoda de 7 cajones a $79.990. Los tomó del catálogo.
2. **Despacho perfecto:** solo Región Metropolitana, de lunes a sábado desde las 3 de la tarde, el chofer avisa 30 minutos antes y la ruta va por cercanía.
3. **Fuera de cobertura:** dice que no hay envíos a Rancagua ni tienda en Viña del Mar, y ofrece retiro en La Granja.
4. **Personalizados:** acierta el plazo de 1 a 3 días hábiles desde que se aprueba el diseño y pide la imagen.
5. **Cocina a medida:** no da precio, pide medidas, color, comuna y foto, y deriva al Área de Diseño.
6. **Objeción de precio (Falabella):** defiende el valor de ser fabricantes sin inventar descuentos.
7. **Tono chileno y cercano** ("¿Te tinca?", "Pucha"), con mensajes breves y siempre con una pregunta para avanzar la venta.
8. **Memoria:** después de aprobar la respuesta sobre despacho a Puente Alto, preguntó por La Florida y **respondió con la misma estructura aprobada**.

## ❌ Lo negativo y cómo quedó

| # | Problema | Ronda | Estado |
|---|---|---|---|
| 1 | Decía "no aceptamos pago contra entrega", pero la política dice que aceptan efectivo | 1 | ✅ Ahora lo anota como duda. **Falta que DTO lo aclare** (ver pendientes) |
| 2 | Inventó "no ofrecemos crédito a 30 días" | 1 | ✅ Ahora lo anota como duda |
| 3 | Escribía códigos raros "[foto: 23440d24]" en el texto | 1 | ✅ Se convierten en fotos y se borran del texto |
| 4 | Decía "te dejo fotos", pero no llegaban | 1–3 | ✅ Arreglado: ahora llegan con foto, nombre, precio y enlace |
| 5 | Inventaba colores ("blanco o negro", "melamina blanca o madera") | 2–3 | ⚠️ Mejoró, pero **falta la política de colores** |
| 6 | Ante un reclamo solo daba el WhatsApp, sin explicar la garantía | 1 | ✅ Ahora explica: fotos, plazo de 24 horas y derivar a Rachel |
| 7 | Saludaba "Hola" en todos los mensajes | 1 | ✅ Saluda solo al inicio |
| 8 | "te avisé" en vez de "te aviso" (error de Gemini) | 2 | ⚠️ Ocasional, propio del modelo gratis |
| 9 | Una vez Gemini estaba saturado o en el límite gratis | 2 | ✅ Ahora reintenta y cambia de modelo solo |

## 📌 Lo que DTO tiene que definir (para que Momo no dude)

1. **¿Se puede pagar en efectivo al recibir el despacho?** ¿O el pago siempre es antes?
2. **¿Hacen descuentos?** Por ejemplo, por pago en efectivo, por llevar 2 muebles o para igualar a la competencia.
3. **¿Factura para empresas y crédito a 30 días?**
4. **Colores disponibles** de cada mueble (melamina, colores del cuerpo y de los frentes).
5. **Costo de despacho por comuna.**

Puedes responder estas preguntas en **Lo que Momo sabe → Dudas** de DTO, o mandármelas a mí para que las cargue.

---

## Qué se agregó a Momo con estas pruebas

- **Memoria de Momo:** "Bien" guarda la respuesta como aprobada y "Corregir" guarda la versión correcta. Momo usa las 25 más recientes como ejemplo, y las corregidas pesan más.
- **Registro de entrenamientos:** cada conversación de práctica queda guardada y se puede revisar en **Lo que Momo sabe → Memoria**.
- **Aprende de las conversaciones reales:** si Rachel guarda una sugerencia de Momo sin cambiarla, también queda en la memoria.
- **Fotos de referencia** del catálogo, con nombre, precio y enlace a la página.
- **Reglas nuevas:** no afirmar lo que no está en las políticas, buscar colores en el catálogo, aplicar la garantía ante reclamos y saludar solo una vez.
