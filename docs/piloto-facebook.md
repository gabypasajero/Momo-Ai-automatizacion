# Piloto: responder los mensajes de venta de Rachel por Facebook

Objetivo: que la IA de Momo responda los mensajes que llegan por **Messenger y Marketplace** a la Página de Facebook de Rachel. Cuando haga falta una persona, la conversación pasa a "Asistencia humana", y todo queda registrado en el embudo.

> En Momo, el negocio de Rachel es la empresa **DeToditoOutlet** (canal de venta de Muebles y Hogar Molina SpA). Ya tiene cargados 221 productos, 7 políticas del negocio y su asistente (ver [catalogo.md](catalogo.md)).

## 1. Requisito clave: Marketplace solo funciona a través de una **Página**

La API oficial de Meta (Messenger Platform) **solo entrega los mensajes que llegan a una Página de Facebook**. Los mensajes de Marketplace enviados a un **perfil personal no se pueden leer por API**: Meta no lo permite, y ninguna herramienta legítima lo hace.

Antes de programar nada, hay que confirmar esto con Rachel:

- [ ] Rachel tiene (o crea) una **Página de Facebook** de su negocio.
- [ ] Sus publicaciones de Marketplace salen **desde la Página** o desde una tienda vinculada a la Página, no desde su perfil personal.
- [ ] En **Meta Business Suite → Bandeja de entrada**, los mensajes de Marketplace **aparecen en la bandeja de la Página**. Si aparecen ahí, Momo podrá leerlos. Si no aparecen, la API no podrá leerlos.

> Si Rachel vende hoy desde su perfil personal, el primer paso del piloto es moverla a la Página. Esto conviene igual: separa lo personal del negocio y le da estadísticas.

## 2. Cuentas y accesos que necesitamos

| Qué | Quién | Para qué |
|---|---|---|
| Cuenta de **Meta Business** (business.facebook.com) | Nosotros (Momo) | Ser dueños de la app de Momo |
| **App de Meta** tipo "Empresa" con el producto **Messenger** | Nosotros | Recibir los avisos de mensajes nuevos (webhooks) y responder |
| Rachel como **administradora de su Página** | Rachel | Conectar su Página a la app |
| Rachel agregada como **evaluadora (tester)** de la app | Nosotros la invitamos | Para el piloto **no hace falta la revisión de Meta** si quien conecta la Página tiene un rol en la app |

### Permisos de la app
- `pages_messaging`: leer y responder mensajes.
- `pages_manage_metadata`: suscribir la Página a los webhooks.
- `pages_show_list`: listar las Páginas del usuario al conectar.

Para vender a otros clientes (fuera del piloto) habrá que pasar la **revisión de la app** y la **verificación del negocio** en Meta. Toma algunas semanas, así que conviene iniciarla en paralelo al piloto.

## 3. Reglas de Meta que el producto debe respetar

- **Ventana de 24 horas**: solo se puede responder libremente hasta 24 h después del último mensaje del cliente. Pasado ese plazo hay que usar etiquetas de mensaje permitidas o esperar a que el cliente vuelva a escribir. El backend debe bloquear los envíos fuera de la ventana.
- **Pasar a un humano**: la IA debe derivar cuando el cliente lo pida, y no inventar precios ni existencias.
- **Privacidad**: los datos de los clientes de Rachel se guardan aislados por empresa (separación por organización en la base de datos).

## 4. Flujo técnico del piloto

```
Cliente escribe en Marketplace/Messenger
        │
        ▼
Meta → POST /api/webhooks/meta  (se verifica la firma con META_APP_SECRET)
        │  guarda el contacto, la conversación y el mensaje (Supabase)
        ▼
Cola de trabajo → Agente IA (Claude)
        │  usa: catálogo de Rachel, historial, reglas del negocio
        │  herramientas: responder · mover el ticket de etapa · derivar a humano
        ▼
Graph API → Send API (responde por Messenger)
        │
        ▼
Bandeja de Chat y Embudo en Momo (tiempo real)
```

## 5. Lo que necesitamos de Rachel para entrenar la IA

- Catálogo: productos, precios, fotos, medidas y existencias (aunque sea en una planilla).
- Políticas: despacho (comunas y costo), formas de pago, retiro en tienda, garantía y cambios.
- Horario de atención y quién atiende cuando la IA deriva.
- 20 a 30 conversaciones reales de ejemplo (preguntas frecuentes y cómo las responde ella).
- Tono de marca: tutear o no, uso de emojis, frases típicas.

## 6. Criterios de éxito del piloto (2 a 4 semanas)

| Métrica | Meta |
|---|---|
| Mensajes respondidos por la IA | ≥ 70 % |
| Tiempo de primera respuesta | < 1 minuto, 24/7 |
| Respuestas incorrectas detectadas | < 5 % |
| Derivaciones a humano bien hechas | 100 % |
| Ventas atribuidas a conversaciones de la IA | Se mide desde la semana 1 |

Con estos números armamos el **caso de éxito** para vender los planes a otras pymes.
