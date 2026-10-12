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
| 5. Mejoras y departamentos | 56 mejoras con requisitos y efectos reales (clic, edificios, globales, especiales, sinergias, final), 5 departamentos con mecánicas nuevas, 24 misiones | ✅ Hecha |
| 6. Logros | 35 logros (3 secretos) con comprobación por temas, recompensas únicas, notificaciones, estadísticas | ✅ Hecha |
| 7. Talentos | 4 ramas, 24 nodos (4 pares excluyentes), costes en Influencia, requisitos, reasignación gratuita al inicio de ciclo | ✅ Hecha |
| 8. Prestigio | Ascenso con vista previa, confirmación explícita, reinicio atómico, conservación de lo permanente, bonus derivado (sin duplicados) | ✅ Hecha |
| 9. Guardado | localStorage versionado, autoguardado 10 s + al ocultar/cerrar, copia de seguridad, recuperación de partidas dañadas, exportar/importar JSON validado, migración v1→v2, progreso offline (8 h base) | ✅ Hecha |
| 10. Balance y acabado | 7 eventos aleatorios con elecciones, formularios dorados, 3 secretos, ajustes de accesibilidad, simulación de balance con 4 estrategias, pruebas, documentación | ✅ Hecha |

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
| Automatización (Ratón con ansiedad) | 14 min 38 s | 12 min 8 s | 37 min 46 s | 10–20 min |
| Nivel 2 | 3 min 19 s | 1 min 38 s | 10 min 17 s | — |
| Nivel 3 («primer departamento adicional») | 16 min 4 s | 13 min 40 s | 24 min 23 s | 20–40 min |
| Nivel 4 | 53 min 40 s | 48 min 2 s | 1 h 3 min | — |
| Primer ascenso | 1 h 6 min (+10) | 58 min 39 s (+10) | 1 h 22 min (+10) | 45–90 min |
| Nivel 5 | 1 h 40 min | 1 h 32 min | 1 h 53 min | — |
| Formulario 404-B (final) | 5 h 24 min | 5 h 27 min | > 6 h | varias horas |

Todas las estrategias son viables y llegan al primer ascenso en el rango
previsto; la pasiva es más lenta al principio, pero el talento «Que nadie toque
nada» (×2 sin clics) y el progreso offline la compensan. `tests/unit/balance.test.js`
fija estos rangos como prueba de regresión.

## Pendiente / ideas para siguientes sesiones

- Segunda capa de prestigio (la arquitectura lo permite: `prestige.js` está
  aislado y los departamentos se definen por datos).
- Más eventos y mejoras de los edificios cósmicos (niveles 25/50).
- Tras ~3 h de partida optimizada los números crecen muy deprisa (escala Sx/Sp).
  Es habitual en el género, pero una segunda capa de prestigio daría más metas.
- Biblioteca de números grandes: no es necesaria (el máximo realista en 6 h es
  ~1e22 y el formato admite hasta 1e308, saturando en lugar de dar Infinity).
- Sonido con archivos (opcional; ahora es sintetizado).
- Traducciones (todo el texto está en los archivos de datos y en las vistas).
