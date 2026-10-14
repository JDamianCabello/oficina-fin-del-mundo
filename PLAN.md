# PLAN — La Oficina del Fin del Mundo

Estado de las fases definidas en `CLAUDE.md` (prompt maestro). Cada fase se
cerró ejecutando las pruebas disponibles (`npm test`, `npm run test:e2e`,
`npm run lint`) y comprobando que el juego seguía arrancando.

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 1. Base ejecutable | Estructura de carpetas, `index.html`, CSS base, estado central (`js/core/state.js`), servidor local documentado, comprobación de arranque (prueba e2e) | ✅ Hecha |
| 2. Núcleo incremental | Clics, recursos, producción por segundo con delta de tiempo, 13 edificios configurables (5 iniciales + 8 avanzados), compras ×1/×10/máximo, formateador numérico | ✅ Hecha |
| 3. Interfaz | Barra superior, tres paneles, tarjetas, 7 pestañas con estados activos, tema oscuro de neón con variables CSS, diseño adaptable (escritorio, tablet, móvil) | ✅ Hecha |
| 4. Arte y animaciones | Descarga verificada de 5 packs de Kenney + 1 de Reaktori (CC0), registro de licencias, sistema de spritesheets configurable, pixel art propio, escena animada en canvas, partículas Canvas 2D, animaciones CSS | ✅ Hecha |
| 5. Mejoras y departamentos | 61 mejoras con requisitos y efectos reales (clic, edificios, globales, especiales, sinergias, final), 5 departamentos con mecánicas nuevas, 24 misiones | ✅ Hecha |
| 6. Logros | 39 logros (3 secretos) con comprobación por temas, recompensas únicas, notificaciones, estadísticas | ✅ Hecha |
| 7. Talentos | 4 ramas, 24 nodos (4 pares excluyentes), costes en Influencia, requisitos, reasignación gratuita al inicio de ciclo | ✅ Hecha |
| 8. Prestigio | Ascenso con vista previa, confirmación explícita, reinicio atómico, conservación de lo permanente, bonus derivado (sin duplicados) | ✅ Hecha |
| 9. Guardado | localStorage versionado, autoguardado 10 s + al ocultar/cerrar, copia de seguridad, recuperación de partidas dañadas, exportar/importar JSON validado, migración v1→v2, progreso offline (8 h base) | ✅ Hecha |
| 10. Balance y acabado | 9 eventos aleatorios con elecciones, formularios dorados, 3 secretos, ajustes de accesibilidad, simulación de balance con 4 estrategias, pruebas, documentación | ✅ Hecha |

## Decisiones de diseño relevantes

- **Moneda**: el «papelerío» se muestra como *Papeleo*.
- **Departamentos permanentes**: una vez desbloqueados, sobreviven al ascenso
  (son «desbloqueos permanentes»). Las misiones y mejoras sí se reinician.
- **Bonificaciones temporales aditivas**: varios efectos temporales positivos se
  suman (×3 y ×7 = ×9) en lugar de multiplicarse, para evitar explosiones.
- **Logros**: cada logro da +1 % de producción, derivado del conjunto de logros
  (no se guarda ningún multiplicador, así que no puede duplicarse al cargar).
- **Escena en canvas**: la oficina se dibuja en un canvas de 384×216 escalado con
  `image-rendering: pixelated`; la interfaz sigue siendo DOM.
- **Audio sintetizado** con Web Audio: sin archivos externos.

## Balance

### Fórmula de prestigio (cambiada respecto al diseño inicial)

El documento proponía `floor(sqrt(ciclo / 1e6))`. La simulación (`npm run balance`)
mostró que, con +2 % de producción por punto, la raíz cuadrada se realimentaba:
cada ascenso multiplicaba la Influencia por ~1000 y en 30 minutos se llegaba a
1e10 puntos. Cambios aplicados:

1. `Influencia = floor(cbrt(ciclo / 1e6) × multInfluencia)` (raíz cúbica).
2. Bonus de Influencia: +2 % por punto hasta 100 puntos; por encima crece con la
   raíz cuadrada (rendimientos decrecientes).
3. Bonificaciones temporales aditivas (ver arriba).
4. Recompensas de misiones reducidas (antes daban hasta 500 s de producción y
   mínimos de 1e14 que se autofinanciaban en ciclos cortos).
5. Edificios cósmicos más espaciados en coste (×50–75 por nivel) y nivel 5 más
   exigente (2 ascensos + 10 impresoras dimensionales).
6. Umbrales de departamentos ajustados: nivel 3 (20 palomas + 500 mil del ciclo),
   nivel 4 (15 reactores + 200 M del ciclo).

### Resultados de la simulación (IA que juega de forma óptima)

La IA compra siempre la mejor opción, reclama misiones y resuelve eventos, así
que un jugador humano tardará algo más (estimación: ×1,3–×2).

| Hito | Equilibrada (2 clics/s) | Clicker (5 clics/s) | Pasiva (0,1 clics/s) | Objetivo de diseño |
|---|---|---|---|---|
| Primer edificio | 29 s | 12 s | 2 min 31 s | < 2 min |
| Primera mejora relevante (impresoras ×2) | 1 min 40 s | 1 min 7 s | 6 min 51 s | 2–5 min |
| Automatización (Ratón con ansiedad) | 11 min 37 s | 8 min 49 s | 34 min 19 s | 10–20 min |
| Nivel 2 | 3 min 19 s | 1 min 38 s | 10 min 17 s | — |
| Nivel 3 («primer departamento adicional») | 12 min 36 s | 10 min 46 s | 22 min 28 s | 20–40 min |
| Nivel 4 | 49 min 49 s | 44 min 50 s | 1 h 1 min | — |
| Primer ascenso | 1 h 2 min (+11) | 56 min 6 s (+10) | 1 h 22 min (+10) | 45–90 min |
| Nivel 5 | 1 h 28 min | 1 h 30 min | 1 h 53 min | — |
| Formulario 404-B (final) y nivel 6 | 4 h 40 min | 4 h 27 min | > 6 h | varias horas |
| Primera fusión (2.ª capa) | 4 h 40 min (+3 ◆) | 4 h 27 min (+2 ◆) | > 6 h | — |

(Simulación tras la sesión 2; los tiempos cambian ligeramente respecto a la
primera versión porque hay más eventos y mejoras.) Todas las estrategias son viables y llegan al primer ascenso en el rango
previsto; la pasiva es más lenta al principio, pero el talento «Que nadie toque
nada» (×2 sin clics) y el progreso offline la compensan. `tests/unit/balance.test.js`
fija estos rangos como prueba de regresión.

## Fase 11: correcciones y segunda capa (sesión 2)

| Tarea | Estado |
|---|---|
| Barra de pestañas móvil: fija abajo, las 7 secciones visibles sin desplazamiento; logo e indicador de guardado visibles | ✅ |
| Texto de la escena nítido: el canvas se dibuja a la resolución real de la pantalla (factor 1–6) manteniendo los sprites sin suavizado | ✅ |
| Audio: se desbloquea en la primera interacción, así suenan también los avisos lanzados por temporizador | ✅ |
| Segunda capa de prestigio: **Fusión multiversal** → Acciones (◆), nivel 6 «Consejo de Administración», 8 ventajas permanentes, migración de partidas v2→v3 | ✅ |
| Más contenido: 5 mejoras cósmicas de nivel 25, 2 eventos nuevos, 4 logros nuevos | ✅ |
| Pruebas: 80 unitarias (10 nuevas de fusión/Consejo/migración) y 37 en navegador | ✅ |

### Balance de la segunda capa (simulación equilibrada, 12 h)

`Acciones = floor(cbrt(Influencia de la fusión / 20000))`, +50 % de producción por
acción ganada. Con un divisor de 1000 la primera fusión daba 8 acciones y el
Consejo completo se compraba en 25 minutos; con 20000 y costes 1–13:

| Hito | Tiempo |
|---|---|
| Formulario 404-B / nivel 6 | ~4 h 40 min |
| Fusión n.º 1 | ~4 h 40 min (+3 ◆) |
| Fusión n.º 2 | ~5 h 02 min (+3 ◆) |
| Fusión n.º 3 | ~5 h 55 min (+6 ◆) |
| Consejo completo (42 ◆ en total) | > 12 h |

## Fase 12: más edificios, hitos y 12 niveles (sesión 3)

| Tarea | Estado |
|---|---|
| 6 edificios nuevos (19 en total) con sus mejoras de nivel 1/10/25 | ✅ |
| Hitos por cantidad (10/25/50/100) en todos los edificios, que mejoran otros edificios, clics, offline, eventos… | ✅ |
| 12 niveles (6 nuevos con ventaja permanente cada uno) | ✅ |
| Cada nivel explica en texto claro cómo superarlo («Objetivo» y lista de departamentos); el 6 dice que hace falta LA MEJORA del formulario 404-B | ✅ |
| Meta final nueva: Formulario 405-C; aviso de mejoras clave en la pestaña Mejoras | ✅ |
| Animaciones: sombras, aparición elástica, estirar/encoger al andar y saltar, lámpara con cono de luz y polvo, vapor, neón que parpadea, ondas al clicar, folios que vuelan a una pila, monedas que giran, papeles que ondean, notificaciones y botones más suaves | ✅ |

Simulación equilibrada (IA óptima, 24 h):

| Hito | Tiempo |
|---|---|
| Nivel 4 / primer ascenso | 43 min / 57 min |
| Nivel 5 | 1 h 27 min |
| Formulario 404-B · nivel 6 | 3 h 13 min |
| Nivel 7 | 3 h 31 min |
| Nivel 8 | 4 h 40 min |
| Nivel 9 | 4 h 57 min |
| Nivel 10 | 6 h 02 min |
| Nivel 11 | 8 h 54 min |
| Nivel 12 | 10 h 51 min |
| Formulario 405-C (final) | 13 h 25 min |

Los hitos se suavizaron tras una primera simulación (con +25 %/+5 % el 404-B
llegaba a las 2 h 49 min) y los requisitos de los niveles 8–12 se espaciaron
porque varios se desbloqueaban a la vez.

## Ideas para siguientes sesiones

- Tercera capa o desafíos (ciclos con reglas especiales).
- Biblioteca de números grandes: no es necesaria (el máximo realista en 12 h es
  ~1e25 y el formato admite hasta 1e308, saturando en lugar de dar Infinity).
- Sonido con archivos (opcional; ahora es sintetizado).
- Traducciones (todo el texto está en los archivos de datos y en las vistas).
