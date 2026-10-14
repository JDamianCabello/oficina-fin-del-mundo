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
  Estadísticas. Con teclado: flechas izquierda/derecha sobre las pestañas. En
  móvil son una barra fija inferior con las 7 secciones a la vista.
- **Formularios dorados**: aparecen a partir del nivel 4. ¡Haz clic antes de que
  se escapen!
- **⚙ Ajustes**: partículas, reducir movimiento, sonido, frecuencia de eventos,
  notación de números, guardar, exportar, importar y borrar.

### Progresión: 12 niveles

Cada nivel explica en la tarjeta **«Objetivo»** (panel derecho) y en la pestaña
**Misiones → Departamentos** qué hay que hacer exactamente para superarlo.

| Nivel | Departamento | Cómo se desbloquea | Novedad |
|---|---|---|---|
| 1 | El Sótano | — | Impresoras y becarios |
| 2 | Planta de Explotación Laboral | 5 becarios + 1.500 de papeleo en el ciclo | Palomas, misiones, eventos |
| 3 | Recursos Humanos del Infierno | 20 palomas + 500 mil en el ciclo | Clones, reactores, sinergias, talentos |
| 4 | Multinacional Interdimensional | 15 reactores + 200 M en el ciclo | **Ascender** (prestigio), formularios dorados |
| 5 | Despacho del Dios Administrativo | 2 ascensos + 10 impresoras dimensionales | Edificios cósmicos |
| 6 | Consejo de Administración | Comprar LA MEJORA «Formulario 404-B» | **Fusión multiversal** (2.ª capa) |
| 7 | Oficina de Gastos Temporales | 1 fusión + 10 Centros de Atención al Apocalipsis | Agencias de viajes en el tiempo · +8 h offline |
| 8 | Burocracia Cuántica | 25 agencias temporales + 10 Sp en el ciclo | Notarías cuánticas · +5 % críticos |
| 9 | Realidades Alternativas | 25 notarías + 1 Oc en el ciclo + 3 fusiones | Imprentas de realidades · dorados +25 % frecuentes |
| 10 | Sede en el Vacío Absoluto | 25 imprentas + 100 Oc + 6 ventajas del Consejo | Cafeterías del Vacío · +25 clics automáticos/s |
| 11 | Accionistas Primordiales | 25 cafeterías + 100 No en el ciclo | Accionistas primordiales · Influencia ×1,5 |
| 12 | El Despacho al Final del Tiempo | 25 accionistas + 1 Dc + 6 fusiones | Bandejas de la entropía · producción ×2 |

Meta final: LA MEJORA **«Formulario 405-C: Apelación del fin del mundo»** (10
bandejas de la entropía y 10 Dc de papeleo).

### Hitos de los edificios

Los 19 edificios tienen hitos automáticos al llegar a **10, 25, 50 y 100**
unidades, que mejoran **otras** partes de la oficina (se ven como ★ en cada tarjeta):

- **10** → el edificio anterior de la cadena produce +15 % (las impresoras: clics +25 %).
- **25** → el edificio siguiente produce +10 %.
- **50** → una ventaja propia (p. ej. impresoras: +5 por clic; palomas: formularios
  dorados más frecuentes; reactores: +5 % offline; Recursos Inhumanos: edificios
  un 3 % más baratos…).
- **100** → +3 % de producción total.

Ascender reinicia papeleo, edificios, mejoras y misiones a cambio de
**Influencia**, que da un bonus permanente de producción y compra talentos.
Se conservan logros, talentos, Influencia, departamentos y estadísticas.

Fusionarse (segunda capa) reinicia además la Influencia y los talentos a cambio
de **Acciones** (◆): +50 % de producción por cada acción ganada y 8 ventajas
permanentes del Consejo de Administración.
Fórmula: `Acciones = floor(cbrt(Influencia ganada en esta fusión / 20000))`.

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

## Versión publicada y actualización automática

El juego se publica en GitHub Pages: https://jdamiancabello.github.io/oficina-fin-del-mundo/

- Cada push a `main` ejecuta las pruebas y, si pasan, publica en la rama
  `gh-pages` (`.github/workflows/pages.yml` + `scripts/build-pages.mjs`).
- Cada versión va en su propia carpeta `v/<commit>/` (se conservan las 3 últimas)
  y el `index.html` raíz apunta a la vigente con `<base href>`. Así nunca se
  mezclan archivos de versiones distintas aunque el navegador los tenga en caché.
- El juego abierto consulta `version.json` cada 5 minutos y al volver a la
  pestaña. Si hay una versión nueva, **guarda la partida y se recarga solo**
  (espera a que no haya ninguna ventana abierta). Se puede desactivar en
  ⚙ Ajustes → «Actualizar automáticamente»; entonces solo muestra un aviso.
- En local (`python3 -m http.server`) no hay `version.json` y no se comprueba nada.

## Pruebas

Requisitos: Node.js 18+ (probado con Node 22). No hay dependencias que instalar.

```bash
npm test            # 87 pruebas unitarias (node --test), incluida una regresión de balance
npm run test:e2e    # Chromium real con Playwright: prueba de humo (37) + actualización automática (6)
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
js/config/*.data.js        DATOS: edificios, departamentos, mejoras, talentos, logros, misiones, eventos,
                           ventajas del Consejo (board.data.js)
js/core/                   state (estado), economy (reglas económicas), progression (requisitos y
                           departamentos), gameLoop (simulación), events (bus de eventos)
js/systems/                buildings, upgrades, talents, achievements, prestige, merger (2.ª capa), missions,
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

No hay errores conocidos que impidan jugar. Limitaciones de diseño:

- Como en todo juego web, el sonido empieza tras la primera interacción con la
  página (lo exige el navegador); a partir de ahí suena todo, incluidos los
  avisos de eventos.
- Tras unas 6 h de juego intensivo los números alcanzan escalas muy grandes
  (Sp, Oc…). El formato lo soporta hasta ~1e308 sin dar Infinity.

## Créditos

Ver [ASSET_CREDITS.md](ASSET_CREDITS.md). Recursos gráficos de Kenney
(www.kenney.nl) y Reaktori, ambos CC0.
