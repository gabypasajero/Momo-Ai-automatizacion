# Momo AI · Resumen de todo lo pedido y lo hecho

**Proyecto:** Momo AI, asistente de ventas con inteligencia artificial para pymes. Piloto con **De Todito Outlet (DTO)** y **Muebles y Hogar Molina**.
**Página oficial:** https://momo-ai-automatizacion-de-todito.vercel.app
**Panel de administración (Momo Control):** https://momo-ai-automatizacion-de-todito.vercel.app/admin
**Actualizado:** 25 de octubre de 2026

---

## 1. Lo que pediste (tus instrucciones)

1. Arreglar los botones que no funcionaban y la pestaña "Conocimiento" en el celular.
2. Publicar los cambios en la página oficial.
3. Contraseñas temporales para Rachel y para ti.
4. Explicar cómo conectar Marketplace y cuánto cuesta la IA (Anthropic).
5. Un **panel de administración solo para ti**, con su propia contraseña.
6. **Rediseñar la app**: original, más simple que Vambe, con los colores e identidad de DTO.
7. Que **todos los botones funcionen**, con área de administrador, inicio de sesión y cambio de contraseña, todo completo.
8. Una descripción completa de la app.
9. Que sea **fácil para personas mayores** y que funcione como **app en Android y iPhone**.
10. Mantener el color vino **#A7325E**.
11. **Avisos al teléfono** y una **vista especial para el teléfono**, distinta a la del computador.
12. Una **app de administración propia** (ganancias, empresas, planes, estadísticas) con un toque único.
13. Responder **siempre en español**, con palabras simples.
14. Darme **autoridad total**: "haz lo que debas y luego corregimos".
15. Probar Momo con **Gemini** (gratis) en vez de Claude.
16. **Momo no debe responder solo a clientes reales**: solo usar el probador.
17. Un **chat de entrenamiento** de verdad: se envía con Enter, guarda lo aprendido y anota sus dudas.
18. **Adjuntar fotos** en el chat.
19. Que Momo **envíe fotos de referencia** de los productos.
20. Que Momo **guarde sus conversaciones y aprenda** de ellas.
21. Una **cuenta de pruebas** para que yo entrene a Momo, mida tiempos y anote lo bueno y lo malo, y te mande **informes y capturas**.
22. Que Momo hable **cálido y humano**, con un toque de gracia, y **reconozca el tipo de cliente**.
23. **Integrar el diseñador** de DTO para que Momo cree muebles personalizados con la imagen o el nombre del cliente.
24. Las **políticas del negocio** (pagos, entrega, colores, abonos, armado, descuentos).

---

## 2. Lo que se hizo

### 2.1 La app (rediseño completo)
- Diseño propio con los colores de DTO, la mascota Momo y letras Nunito y Quicksand.
- **Secciones:**
  - **Hoy:** resumen del día, clientes que esperan, ventas de la semana y dudas de Momo.
  - **Conversaciones:** cada chat con su venta al lado; Momo sugiere la respuesta.
  - **Clientes:** fichas y exportar a Excel.
  - **Lo que Momo sabe:** Entrenar a Momo, Aprendizaje, Políticas, Productos, Dudas y Personalidad.
  - **Resultados:** ventas, conversaciones y canales.
  - **Ajustes:** perfil, contraseña, empresa, equipo, plan y canales.
- Inicio de sesión, recuperar contraseña, cambio de contraseña y aviso cuando la contraseña es temporal.
- Equipo con roles (dueño, administrador, vendedor, solo lectura) y límites según el plan.

### 2.2 Momo Control (tu área de administración)
- Pide una contraseña propia. Se cierra sola a los 30 minutos y se bloquea con 5 intentos fallidos.
- **Inicio:** ganancia del mes, proyección anual, empresas activas, cuánto paga en promedio cada empresa, empresas por plan, crecimiento y últimos movimientos.
- **Empresas** (como tarjetas en el teléfono), **Ganancias** (de dónde viene la plata, costo de IA por día, ganancia por empresa), **Solicitudes**, **Consumo de IA** y **Seguridad**.
- Diseño oscuro vino con detalles dorados, distinto a la app de las empresas.
- Se instala aparte, con su propio ícono (la mascota con anillo dorado).

### 2.3 App en el teléfono y el computador
- **Se instala** en Android, iPhone, tablet y Windows (Chrome o Edge), sin tiendas de apps.
- **Portada especial para el teléfono:** saludo grande y 3 botones gigantes (Te esperan, Vendí, Mis clientes).
- Barra inferior flotante color vino con botones grandes.
- Botón **"Letra grande"**, pensado para personas mayores.
- Con el teclado abierto, la barra y la mascota se esconden para no tapar lo que se escribe.
- Aviso "Sin conexión" fácil de entender.
- Íconos corregidos: la mascota ahora tiene los ojos abiertos.
- La dirección de pruebas redirige sola a la oficial.

### 2.4 Avisos al teléfono
- Botón **"Activar avisos"** (en Más y en Ajustes).
- Cuando un cliente escribe, llega **"Fulano te escribió"** al teléfono del equipo; al tocarlo se abre el chat.
- Las claves de los avisos se crean solas y quedan guardadas de forma segura en Supabase.
- **Pendiente:** probarlo en un teléfono real.

### 2.5 Inteligencia de Momo
- **Funciona con Gemini (gratis) o con Claude.** Si Gemini está saturado, reintenta y cambia de versión solo.
- **Las conversaciones parten en "Respondes tú"**: Momo no responde solo a clientes reales.
- **Entrenar a Momo:**
  - Chat de práctica que se envía con Enter.
  - Se pueden **adjuntar fotos**.
  - Botones **"Bien"** y **"Corregir"** en cada respuesta.
  - Lo que Momo no sabe lo **anota como duda**.
- **Fotos de referencia:** envía hasta 3 fotos del catálogo, con nombre, precio y enlace.
- **Diseñador integrado:** crea la **vista previa del mueble personalizado** con la foto y/o el nombre del cliente, en 11 modelos con medidas reales, y trae el botón "Descargar para enviar".
- **Memoria:**
  - Guarda las respuestas aprobadas y corregidas, y Momo las usa como ejemplo.
  - Aprende cuando se edita una de sus sugerencias.
  - Guarda cada entrenamiento.
- **Resumen semanal ("Analizar mi semana"):** lo que más preguntan, objeciones, lo que funcionó y políticas sugeridas para agregar.
- **Forma de hablar:**
  - Cálida y humana, como una vendedora chilena cercana.
  - Se adapta al cliente: directo, mamá o papá, formal, molesto o indeciso.
  - Si le preguntan si es un bot, es honesto.
  - Copia los precios exactos y no inventa datos.

### 2.6 Políticas cargadas (en DTO, Molina y la cuenta de pruebas)
| Política | Qué dice |
|---|---|
| Despacho | Solo Región Metropolitana. Lunes a sábado desde las 3 de la tarde; el chofer avisa 30 minutos antes y la ruta va por cercanía. |
| Entrega a domicilio | Todo llega **armado**. Se entrega en la puerta; el chofer **no está obligado a subir** a departamentos ni a entrar el mueble. |
| Pago al recibir y abonos | Se puede pagar **el total al recibir**: el chofer acepta tarjeta, transferencia y efectivo (se prefiere tarjeta o transferencia). Los abonos se descuentan del total. |
| Medios de pago | Efectivo, débito, crédito y transferencia. |
| Factura | Sí se emite factura a empresas, **sin crédito a 30 días**. |
| Descuentos | No se hacen. Se destaca que los fabrican ellos mismos y que duran muchos años, **sin detalles técnicos del armado**. |
| Colores | Cuerpo **siempre blanco**; los frentes van con vinilo personalizado. Burletes: blanco, azul, celeste y rosado; otros colores se confirman con Rachel o con el diseñador. |
| Abono por nombre | De $5.000 a $10.000, y se descuenta del total. |
| Regla general | Si dos políticas se contradicen, manda la más reciente. |

### 2.7 Pruebas realizadas (con la cuenta de pruebas `pruebas.momo@example.com`)
| Ronda | Correctas | Inventadas | Tiempo promedio |
|---|---|---|---|
| 1 | 9 de 14 | 3 | 1,7 s |
| 3 | 13 de 15 | 0 | 2,1 s |
| 4 | 14 de 15 | 0 | 2,0 s |
| 5 | 7 de 7 | 0 | 1,8 s |
| Tono y diseño | ✅ Cálido, honesto y con vistas previas funcionando | 0 | 1,4 a 5 s |

Los informes y capturas están en `docs/pruebas/`.

### 2.8 Base de datos (Supabase), lo que se agregó
- Teléfonos que reciben avisos y el disparador del aviso cuando escribe un cliente.
- Memoria de Momo, registro de entrenamientos y resúmenes de aprendizaje.
- La empresa de pruebas "Momo Pruebas (copia de DTO)".
- Limpieza de funciones antiguas: la hiciste tú desde el SQL Editor.

---

## 3. Pendientes

### De tu parte
1. **Costos de despacho por comuna** (dijiste que los mandabas mañana).
2. **Probar los avisos al teléfono**, con Rachel anotando un mensaje de cliente.
3. **Crear la Página de Facebook de DTO** para conectar Messenger e Instagram.
4. Decidir si mantener el saludo que ustedes le enseñaron (*"Te habla el asistente de De Todito Outlet"*).
5. Descartar en **Dudas** las preguntas que ya quedaron respondidas.
6. Más adelante: la clave de Claude o de Gemini pagado, para atender clientes reales sin saturaciones.

### De mi parte (propuestas)
1. Conectar Messenger e Instagram cuando exista la página de DTO.
2. Guardar las fotos de los clientes en las conversaciones reales, para que el diseño también salga con su imagen.
3. Que Momo dé el total con despacho apenas estén los costos por comuna.
4. Publicar en Play Store y App Store cuando haya 3 a 5 clientes pagando.
