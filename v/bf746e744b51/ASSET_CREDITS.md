# Créditos y licencias de los recursos

Todos los recursos gráficos de terceros incluidos en el proyecto son **CC0 1.0
(dominio público)**. Se verificó la licencia de cada uno antes de incorporarlo
(fecha de consulta y descarga: **2026-10-12**). Las copias de los textos de
licencia están en `assets/licenses/`.

CC0 no exige atribución, pero se acredita igualmente a sus autores.

## Kenney (www.kenney.nl)

Autor: Kenney Vleugels / Kenney (https://kenney.nl). Licencia: Creative Commons
Zero (CC0), según el `License.txt` incluido en cada ZIP y la página de cada pack
(«CC0 licensed»).

| Pack | URL de origen | Archivos usados en el juego | Modificaciones |
|---|---|---|---|
| Pixel Platformer (v1.2) | https://kenney.nl/assets/pixel-platformer | `Tilemap/tilemap-characters_packed.png` → `assets/sprites/kenney/platformer-characters.png` | Solo renombrado. Se usan los personajes alienígenas (2 fotogramas) como «becarios interdimensionales». |
| Pixel Platformer: Industrial Expansion (v1.0) | https://kenney.nl/assets/pixel-platformer-industrial-expansion | `Tilemap/tilemap_packed.png` → `assets/sprites/kenney/industrial-tiles.png` | Solo renombrado. Tuberías del techo, reactor (tanques, sirenas, máquina) y cinta transportadora. |
| Tiny Dungeon (v1.0) | https://kenney.nl/assets/tiny-dungeon | `Tilemap/tilemap_packed.png` → `assets/sprites/kenney/tiny-dungeon.png` | Solo renombrado. Personajes humanos usados como becarios y como el protagonista. |
| Particle Pack (v1.1) | https://kenney.nl/assets/particle-pack | `PNG (Transparent)/star_06.png`, `light_01.png`, `smoke_04.png`, `spark_05.png`, `circle_05.png`, `magic_02.png` | Reducidos de 512×512 a 32×32 (Lanczos) y combinados en un atlas horizontal `assets/sprites/kenney/particles-atlas.png`. |
| Kenney Fonts | https://kenney.nl/assets/kenney-fonts | `Fonts/Kenney Pixel.ttf` → `assets/fonts/kenney-pixel.ttf`, `Fonts/Kenney Mini.ttf` → `assets/fonts/kenney-mini.ttf` | Solo renombrado. Se comprobó que incluyen tildes, ñ, ¿ y ¡. |

También se consultó **Pixel UI Pack** (https://kenney.nl/assets/pixel-ui-pack, CC0),
pero no se incluye: su estilo claro no encajaba con la interfaz oscura de neón,
que se ha hecho con CSS.

## Reaktori — Debts in the Depths

- Pack: *Debts in the Depths – Free Pixel Art Dungeon Asset Pack*
- Autor: Reaktori
- URL: https://reaktori.itch.io/debts-in-the-depths-asset-pack
- Licencia: Creative Commons Zero v1.0 Universal. El ZIP no incluye archivo de
  licencia; el texto se ha copiado de la página oficial del pack en
  `assets/licenses/reaktori-debts-in-the-depths-LICENSE.txt`.
- Descarga: gratuita desde itch.io («Name your own price», 0 €).

| Archivo original | Uso en el juego | Modificaciones |
|---|---|---|
| `Characters/sprMinotaur1.png` (4 fotogramas, 31×24) | Departamento de Recursos Inhumanos | Ninguna |
| `Characters/sprGhost1.png`, `sprGhost3.png` (4 fotogramas, 19×28) | Departamento de paradojas | Ninguna |
| `Characters/sprLizardMonk1.png` (4 fotogramas, 21×20) | Ministerio del Tiempo Perdido | Ninguna |
| `Characters/sprWizard.png` (7 fotogramas, 26×18) | Servidor que contiene a Dios | Ninguna |
| `Characters/sprDragon.png` (6 fotogramas, 70×73) | Centro de Atención al Apocalipsis | Ninguna (se dibuja volteado) |
| `Characters/sprSkeleton1.png` (4 fotogramas, 19×20) | «El empleado más antiguo» (decoración del nivel 3) | Ninguna |
| `Characters/sprGoblin3.png` (4 fotogramas, 25×25) | Auditores del evento «Auditoría sorpresa» | Ninguna |
| `Effects/sprSparkle.png`, `sprExplosion.png`, `sprMagicExplosion.png` | Destellos de aparición, compras y portal dimensional | Ninguna |

## Recursos propios del proyecto

Creados específicamente para este juego y cedidos como **CC0**:

- **Pixel art en código** (`js/ui/pixelArt.js`): impresora de segunda mano (y sus
  variantes dimensional y dorada por recoloreado), paloma contable (4 fotogramas:
  quieta, picoteando y dos de vuelo), el jefe y sus clones (2 fotogramas, más
  variantes holograma y roja), mesa, ordenador CRT, máquina de café, planta,
  dispensador de agua, servidor con luces parpadeantes y formulario dorado.
- **Gráficos procedurales** (`js/ui/scene.js`, `js/ui/sprites.js`): pared y suelo
  de cada departamento, ventana con cielo apocalíptico, planeta, meteoritos,
  universos en órbita, carteles de neón, póster y reloj.
- **Partículas dibujadas** (`js/ui/particles.js`): papeles, monedas, chispas y
  confeti (rectángulos en Canvas 2D).
- **Icono** `assets/icons/favicon.svg`.
- **Sonido**: todos los efectos se sintetizan en tiempo real con Web Audio
  (`js/ui/audio.js`). No hay archivos de audio (ver `assets/audio/README.md`).

## Recursos descartados

No se ha incluido ningún recurso cuya licencia no se pudiera verificar, ni
imágenes de otros videojuegos.
