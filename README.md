# La Oficina del Fin del Mundo

Juego incremental / idle / clicker en el navegador. El universo no puede
terminar porque nadie ha tramitado el **formulario 404-B** que autoriza el
apocalipsis. Tú eres el becario encargado. Empiezas en un sótano con una
impresora traumatizada y acabas siendo el dios administrativo del multiverso.

- HTML5 + CSS3 + JavaScript moderno (ES Modules), sin frameworks ni compilación.
- Pixel art animado (Kenney y Reaktori, CC0, más arte propio) en Canvas 2D.
- Funciona sin conexión: todos los recursos están en el proyecto.

## Cómo jugar (ejecutar en local)

Los ES Modules no funcionan abriendo `index.html` con doble clic (`file://`):
hace falta un servidor estático. Desde esta carpeta:

```bash
python3 -m http.server 8000
# o bien: npm start   (hace lo mismo)
# o bien: npx serve .
```

Y abre **http://localhost:8000** en un navegador moderno (Chrome, Firefox, Edge
o Safari recientes).

### Controles

- **Clic en la oficina** o botón **SELLAR FORMULARIO** (también con Enter/Espacio
  cuando tiene el foco): produce papeleo.
- **Edificios**: compra ×1, ×10 o el máximo asequible (selector en el panel).
- **Pestañas**: Edificios, Mejoras, Talentos, Logros, Misiones, Prestigio y
  Estadísticas. Con teclado: flechas izquierda/derecha sobre las pestañas.
- **Formularios dorados**: aparecen a partir del nivel 4. ¡Haz clic antes de que
  se escapen!
- **⚙ Ajustes**: partículas, reducir movimiento, sonido, frecuencia de eventos,
  notación de números, guardar, exportar, importar y borrar.

### Progresión

1. **El Sótano** (nivel 1): impresoras y becarios.
2. **Planta de Explotación Laboral** (nivel 2): palomas contables, misiones y
   eventos aleatorios.
3. **Recursos Humanos del Infierno** (nivel 3): clones del jefe, reactores,
   sinergias y árbol de talentos.
4. **Multinacional Interdimensional** (nivel 4): **prestigio** (Ascender),
   formularios dorados y máquinas de otras dimensiones.
5. **Despacho del Dios Administrativo** (nivel 5): edificios cósmicos y el
   formulario 404-B (final de la historia; se puede seguir jugando).

Ascender reinicia papeleo, edificios, mejoras y misiones a cambio de
**Influencia**, que da un bonus permanente de producción y compra talentos.
Se conservan logros, talentos, Influencia, departamentos y estadísticas.

## Partidas guardadas

- Se guardan en el **localStorage** del navegador, clave
  `oficinaFinDelMundo.save`, cada 10 segundos, al cambiar de pestaña y al
  cerrar la página.
- Copia de seguridad del último guardado válido: `oficinaFinDelMundo.backup`
  (se actualiza como mucho cada minuto y al cargar con éxito).
- Si la partida principal está dañada, se carga la copia de seguridad y el texto
  dañado se conserva en `oficinaFinDelMundo.corrupt.<fecha>`; el juego avisa.
- **Exportar**: ⚙ Ajustes → Exportar → Copiar o *Descargar .json*.
- **Importar**: ⚙ Ajustes → Importar → pega el JSON o elige el archivo. Se valida
  todo (tipos, rangos, ids conocidos, tamaño máximo de 512 KB) antes de sustituir
  la partida actual. Las partidas antiguas se migran automáticamente.
- **Progreso offline**: al volver se suma la producción del tiempo ausente
  (máximo 8 h y 50 % de eficiencia de base; talentos y mejoras lo amplían).

Los datos se guardan por navegador y por dirección: `localhost:8000` y otra
dirección o puerto son partidas distintas.

## Pruebas

Requisitos: Node.js 18+ (probado con Node 22). No hay dependencias que instalar.

```bash
npm test            # 69 pruebas unitarias (node --test), incluida una regresión de balance
npm run test:e2e    # prueba de humo en Chromium real con Playwright (33 comprobaciones)
npm run balance     # simulación de balance: node tests/tools/balance.mjs [horas] [informe-min] [estrategia]
npm run lint        # ESLint con reglas básicas (eslint.config.js)
```

`test:e2e` necesita Playwright y Chromium (`npm i -D playwright && npx playwright
install chromium` si no están instalados globalmente). Levanta su propio
servidor en un puerto libre y guarda capturas en `tests/e2e/output/`. Se puede
indicar otro navegador con `CHROMIUM_PATH=/ruta/al/chromium`.

## Estructura

```
index.html                 Página única
css/                       variables, base, layout, components, animations, responsive
js/main.js                 Arranque: carga, offline, bucles, autoguardado, acciones
js/config/*.data.js        DATOS: edificios, departamentos, mejoras, talentos, logros, misiones, eventos
js/core/                   state (estado), economy (reglas económicas), progression (requisitos y
                           departamentos), gameLoop (simulación), events (bus de eventos)
js/systems/                buildings, upgrades, talents, achievements, prestige, missions,
                           offlineProgress, randomEvents, effects (efectos temporales)
js/storage/                save (guardado, validación, exportar/importar), migrations
js/ui/                     render (orquestador), navigation, notifications, sprites, pixelArt,
                           scene (oficina), particles, audio, dom, views/ (cada panel y diálogos)
js/utils/format.js         Formato de números y tiempos en español
assets/                    sprites/, icons/, fonts/, licenses/ (ver ASSET_CREDITS.md)
tests/unit/                Pruebas unitarias (node:test)
tests/e2e/smoke.mjs        Prueba en navegador
tests/tools/balance.mjs    Simulador de balance
```

### Arquitectura

- El **estado** (`js/core/state.js`) es un objeto plano serializable, sin DOM ni
  valores derivados.
- **Toda** la economía vive en `js/core/economy.js`: el papeleo solo entra por
  `addPaperwork()` y solo sale por `spendPaperwork()`, que rechazan NaN, Infinity
  y negativos.
- Los multiplicadores se **recalculan** a partir de los ids comprados
  (`getModifiers()`), con caché por clave: cargar una partida nunca duplica
  bonificaciones.
- Fórmula de producción:
  `pps = Σ [base × cantidad × multEdificio × (1 + sinergias)] × multGlobal`, con
  `multGlobal = Π mejoras/talentos × (1 + Σ temporales) × (1 + 1 % × logros) × multPrestigio × condicionales`.
  Clic = `(1 + plano) × multClic × multGlobal + pps × %clic`.
- La lógica emite hechos por un bus (`js/core/events.js`) y la interfaz reacciona
  (partículas, sonidos, notificaciones). La lógica nunca toca el DOM.
- Tres procesos separados: simulación (`setInterval` 100 ms con delta medido),
  interfaz (10 Hz, solo cambia nodos cuyo texto varía) y animación
  (`requestAnimationFrame`, pausado con la pestaña oculta).

### Formato de números

`950` · `12,5` · `1,25 mil` · `1,4 M` · `2,3 B` · `5,6 T` · `Qa`, `Qi`, `Sx`, `Sp`,
`Oc`, `No`, `Dc`… hasta 1e63; después, notación científica (`1,23e66`). Se usa
la escala corta habitual en los incrementales (B = 10⁹, T = 10¹²) con coma
decimal. En Ajustes se puede elegir notación científica desde 1e6. Internamente
se usan números de doble precisión; el papeleo satura en ~1,8e308 en vez de
llegar a Infinity (con el balance actual, 6 h de juego óptimo rondan 1e22).

## Cómo ampliar el juego

Todo el contenido está en `js/config/`. Ejemplos:

- **Edificio nuevo**: añade un objeto a `BUILDINGS` (`id`, `name`, `baseCost`,
  `costGrowth`, `baseProduction`, `department`, `icon`). La economía, la lista,
  el guardado y la validación lo recogen solos. Para que aparezca en la escena,
  añade su representación en `desiredCounts()`/`drawMachines()` de `js/ui/scene.js`.
- **Mejora**: añade a `UPGRADES` con `requirements` y `effects`
  (tipos documentados al principio de `js/core/economy.js`).
- **Talento**: añade a `TALENTS` con `branch`, `cost`, `requires`, `excludes` y `pos`.
- **Logro**: añade a `ACHIEVEMENTS` con `condition` (mismo formato de requisitos)
  y `reward` opcional.
- **Misión / evento**: `missions.data.js` y `randomEvents.data.js`.
- **Cambiar el formato de la partida**: sube `SAVE_VERSION` en
  `js/core/state.js` y añade la migración en `js/storage/migrations.js`.

Tras cualquier cambio de números, ejecuta `npm run balance` y `npm test`.

## Accesibilidad

- Navegación con teclado, foco visible, enlace «Saltar al contenido».
- Etiquetas ARIA en botones, pestañas (`tablist`) y regiones vivas.
- Disponibilidad indicada con texto e iconos (✓ / ✗ / 🔒), no solo con color.
- Los botones deshabilitados muestran por qué («Te faltan X»).
- Respeta `prefers-reduced-motion` y tiene ajuste propio de movimiento reducido.
- Partículas, sonido y eventos se pueden desactivar.

## Problemas conocidos

- Los textos dentro de la escena (carteles, bocadillos) se dibujan con una fuente
  pixel a tamaño pequeño y pueden verse algo suaves al escalar.
- En móvil (≤ 760 px) la barra de pestañas no cabe entera: se desplaza en
  horizontal (Misiones, Prestigio y Estadísticas quedan a la derecha). El logo y
  el estado de guardado se ocultan para dejar sitio a los recursos.
- El sonido sintetizado puede no sonar hasta la primera interacción (política de
  reproducción automática de los navegadores).

## Créditos

Ver [ASSET_CREDITS.md](ASSET_CREDITS.md). Recursos gráficos de Kenney
(www.kenney.nl) y Reaktori, ambos CC0.
