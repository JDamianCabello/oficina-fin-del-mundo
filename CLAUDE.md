# CLAUDE.md — La Oficina del Fin del Mundo

Este archivo contiene el **prompt maestro** del proyecto. Cualquier sesión de desarrollo
debe leerlo antes de trabajar y continuar desde la fase pendiente indicada en `PLAN.md`.

Notas operativas para futuras sesiones:

- Ejecutar el juego: `python3 -m http.server 8000` en esta carpeta y abrir http://localhost:8000
- Pruebas unitarias: `npm test` (usa `node --test`, sin dependencias).
- Prueba de humo en navegador: `npm run test:e2e` (usa Playwright + Chromium si existen).
- Simulación de balance: `npm run balance`.
- Estado de las fases: ver `PLAN.md`. Licencias: ver `ASSET_CREDITS.md`.

---

# PROMPT MAESTRO — LA OFICINA DEL FIN DEL MUNDO

## 0. TU PAPEL Y TU MISIÓN

Actúa como un equipo de desarrollo profesional formado por:

* Un desarrollador senior de JavaScript y arquitectura web.
* Un diseñador de juegos especializado en incremental games, idle games y sistemas de prestigio.
* Un diseñador de interfaces para videojuegos.
* Un artista técnico especializado en pixel art, spritesheets y animaciones web.
* Un diseñador de economías y progresión.
* Un ingeniero de QA responsable de probar y corregir errores.

Tu misión es desarrollar un videojuego incremental web completo llamado La Oficina del Fin del Mundo.

NO quiero solamente una explicación, una arquitectura teórica, una maqueta estática ni un conjunto de ejemplos aislados. Quiero que inspecciones el directorio de trabajo, crees los archivos necesarios, escribas el código, integres recursos gráficos gratuitos y de licencias compatibles, ejecutes las pruebas que estén disponibles y corrijas los problemas que encuentres.

Debes trabajar de forma autónoma y progresiva, tomando decisiones razonables sin preguntarme por cada detalle menor.

Cuando una funcionalidad no esté terminada, no simules que funciona. Implementa una versión real y verificable o documenta claramente qué queda pendiente.

El resultado debe poder ejecutarse localmente en un navegador moderno.

## 1. CONCEPTO DEL JUEGO

### 1.1. Premisa narrativa

El universo está a punto de terminar porque una megacorporación no ha procesado el formulario 404-B necesario para autorizar el apocalipsis.

El jugador es un becario contratado por la empresa responsable de gestionar el fin de la realidad.

Empieza en un sótano con una mesa, un ordenador viejo y una impresora que funciona cuando quiere.

Su trabajo consiste en producir papeleo, ganar recursos, comprar maquinaria, contratar empleados y ascender dentro de una corporación cada vez más absurda.

Con el tiempo podrá:

* Contratar palomas contables.
* Clonar al jefe.
* Crear departamentos que no deberían existir.
* Automatizar el papeleo.
* Fabricar universos en impresoras defectuosas.
* Manipular las leyes de la física mediante formularios.
* Reiniciar la empresa y conservar conocimientos permanentes.
* Llegar a ser el dios administrativo del multiverso.

El tono debe ser surrealista, satírico, irreverente y muy gracioso.

El humor debe aparecer en las mecánicas, los nombres, los mensajes, los eventos, los logros, las mejoras y las animaciones.

No conviertas el juego en una colección de botones con nombres graciosos: el humor debe formar parte de la experiencia.

### 1.2. Identidad

Nombre: La Oficina del Fin del Mundo.

Género: incremental / idle / clicker con progresión por capas y prestigio.

Plataforma: navegador web.

Tecnologías obligatorias:

* HTML5.
* CSS3.
* JavaScript moderno con ES Modules.
* DOM para la interfaz.
* Canvas 2D para partículas y efectos cuando sea conveniente.
* localStorage para el guardado inicial.

No utilices React, Vue, Angular ni otros frameworks de interfaz.

No introduzcas TypeScript ni un proceso de compilación complejo sin una justificación importante.

Evita dependencias externas innecesarias. Si una biblioteca resulta verdaderamente útil, explica por qué y mantén el proyecto sencillo de ejecutar.

El juego debe funcionar sin conexión una vez descargados los archivos y recursos necesarios.

## 2. OBJETIVO DE CALIDAD

Construye una primera versión completa que incluya:

* Economía funcional.
* Producción automática.
* Edificios comprables.
* Mejoras individuales y globales.
* Departamentos desbloqueables.
* Misiones y objetivos.
* Logros persistentes.
* Árbol de talentos.
* Sistema de prestigio.
* Guardado automático.
* Importación y exportación de partidas.
* Producción offline limitada.
* Personajes pixel art animados.
* Partículas y efectos visuales.
* Interfaz oscura con neón.
* Ajustes de accesibilidad y rendimiento.
* Diseño adaptable a ordenador y móvil.
* Una progresión que dure varias horas y permita múltiples reinicios.

No es necesario crear cientos de elementos de contenido antes de tener una economía funcional.

Primero implementa correctamente el núcleo. Después añade contenido real utilizando configuraciones de datos ampliables.

La prioridad es un juego coherente, jugable, estable y fácil de ampliar.

## 3. FLUJO DE TRABAJO OBLIGATORIO

Antes de programar:

1. Inspecciona el directorio actual.
2. Comprueba qué archivos y herramientas existen.
3. Determina si el proyecto ya contiene código que debas conservar.
4. Si está vacío, crea la estructura inicial.
5. Si hay código existente, no lo sobrescribas indiscriminadamente.
6. Crea un documento PLAN.md con las fases de implementación.
7. Crea un README.md con instrucciones de ejecución.
8. Crea un ASSET_CREDITS.md para registrar los recursos gráficos, sus autores, URLs, licencias y modificaciones realizadas.

Después, implementa el proyecto por fases.

Al terminar cada fase:

* Ejecuta las comprobaciones disponibles.
* Corrige los errores.
* Comprueba que el juego continúa ejecutándose.
* Actualiza PLAN.md.
* Continúa con la siguiente fase sin esperar mi aprobación, salvo que encuentres una limitación que realmente impida continuar.

No te limites a generar archivos: verifica su contenido y sus interacciones.

No afirmes que has ejecutado pruebas si no las has ejecutado.

No afirmes que has descargado recursos si no están presentes en el proyecto.

## 4. DIRECCIÓN ARTÍSTICA

### 4.1. Estética

El juego debe tener una estética pixel art inspirada en juegos retro de 16 bits, combinada con una interfaz oscura, luces de neón y humor corporativo.

Paleta principal:

* Fondo principal: #10111B.
* Paneles: #191C2C.
* Paneles secundarios: #252A40.
* Cian neón: #32F5C8.
* Magenta neón: #FF4FD8.
* Amarillo de advertencia: #FFD166.
* Texto principal: #F4F4FA.
* Texto secundario: #A9A9BC.

Utiliza variables CSS para toda la paleta.

Evita una interfaz genérica que parezca un panel administrativo moderno. Debe sentirse como un videojuego.

La interfaz puede tener bordes pixelados, paneles retro, sombras de neón, iconos, animaciones y efectos de hover, pero debe conservar una jerarquía visual clara.

El humor debe ser absurdo; la legibilidad no.

### 4.2. Escena principal

La oficina debe ser el centro visual del juego.

Debe contener una composición animada de: mesas, ordenadores, impresoras, máquinas, empleados, palomas contables, objetos absurdos y elementos ambientales.

Los personajes deben moverse de manera visible, no ser simples imágenes estáticas.

Incluye animaciones de trabajo, respiración, balanceo, celebración y reacción a determinados eventos siempre que los recursos disponibles lo permitan.

Cuando el jugador compre un edificio o alcance un hito, la escena debe reflejarlo visualmente.

### 4.3. Recursos gráficos gratuitos

Investiga y utiliza preferentemente recursos CC0 de estas fuentes:

* Kenney: https://kenney.nl/assets
* Pixel Platformer: https://kenney.nl/assets/pixel-platformer
* Pixel UI Pack: https://kenney.nl/assets/pixel-ui-pack
* Industrial Expansion: https://kenney.nl/assets/pixel-platformer-industrial-expansion
* Particle Pack: https://kenney.nl/assets/particle-pack
* Recursos de criaturas: https://reaktori.itch.io/debts-in-the-depths-asset-pack

Estas URL son puntos de partida, no una garantía de que todos los archivos, nombres de descarga o licencias continúen iguales.

Verifica la licencia real de cada recurso antes de incorporarlo.

Busca especialmente: spritesheets animados, personajes con ciclos de caminar, objetos industriales, máquinas, escritorios y ordenadores, iconos, partículas, elementos de interfaz.

Prioriza recursos CC0 y evita recursos que requieran atribución cuando exista una alternativa equivalente con licencia CC0.

No confundas «descarga gratuita» con «uso comercial permitido».

No uses imágenes extraídas de otros videojuegos, recursos pirateados ni packs sin una licencia verificable.

No descargues ni incluyas recursos si no puedes verificar su procedencia.

Si una descarga no está disponible, utiliza otro recurso gratuito con licencia clara o crea gráficos procedurales propios mediante Canvas, CSS o SVG.

No detengas todo el desarrollo por no encontrar un sprite concreto.

### 4.4. Organización de los recursos

Organiza los archivos en: `assets/sprites/`, `assets/backgrounds/`, `assets/icons/`, `assets/audio/`, `assets/licenses/`.

Registra en ASSET_CREDITS.md: nombre del pack, autor o creador, URL de origen, licencia, fecha de consulta si está disponible, archivos utilizados, modificaciones realizadas.

No incluyas URLs ficticias ni atribuciones inventadas.

### 4.5. Renderizado pixel art

Utiliza image-rendering: pixelated para sprites escalados.

Mantén tamaños y proporciones coherentes.

Evita interpolaciones borrosas.

Si un spritesheet contiene varias animaciones, implementa un sistema configurable de fotogramas, columnas, filas, duración y nombre de animación.

No presupongas que todos los spritesheets utilizan el mismo formato.

## 5. ARQUITECTURA DEL PROYECTO

Estructura objetivo:

```
oficina-fin-del-mundo/
  index.html  README.md  PLAN.md  ASSET_CREDITS.md
  css/ variables.css base.css layout.css components.css animations.css responsive.css
  js/ main.js
    config/ buildings.data.js upgrades.data.js talents.data.js achievements.data.js missions.data.js
    core/ state.js gameLoop.js economy.js events.js progression.js
    systems/ buildings.js upgrades.js talents.js achievements.js prestige.js missions.js offlineProgress.js
    ui/ render.js navigation.js notifications.js sprites.js particles.js
    storage/ save.js migrations.js
  assets/ sprites/ backgrounds/ icons/ audio/ licenses/
  tests/
```

Puedes adaptar esta estructura si existe una razón técnica real, pero conserva la separación de responsabilidades.

No introduzcas abstracciones excesivas.

### 5.1. Reglas de arquitectura

* El estado de la partida debe estar separado del DOM.
* Los módulos de economía no deben consultar directamente elementos HTML.
* Los datos de edificios, mejoras, talentos y logros deben estar separados de su lógica de ejecución.
* La interfaz debe representar el estado real del juego, no mantener una segunda economía independiente.
* Centraliza las modificaciones de recursos.
* Evita duplicar reglas entre los eventos de los botones y los módulos económicos.
* Utiliza nombres consistentes y funciones pequeñas.
* No almacenes en la partida valores que puedan derivarse fácilmente de otros datos, salvo que exista una razón de rendimiento.
* Los multiplicadores deben recalcularse de manera consistente y no acumularse repetidamente cada vez que se carga la partida.

## 6. ESTADO CENTRAL

Define un estado central con una estructura equivalente a esta:

```
{
  version: 1,
  resources: { paperwork: 0, lifetimePaperwork: 0, influence: 0, totalInfluenceEarned: 0 },
  buildings: { printer: 0, intern: 0, pigeon: 0, bossClone: 0, bureaucracyReactor: 0 },
  upgrades: [], talents: [], achievements: [],
  unlockedDepartments: ["basement"],
  statistics: { totalClicks: 0, totalPrestiges: 0, playTimeSeconds: 0 },
  settings: { particles: true, reducedMotion: false, sound: true },
  lastSavedAt: 0
}
```

Adapta la estructura para hacerla funcional y coherente. Los valores económicos internos deben conservar suficiente precisión. Redondea únicamente al mostrar cantidades o cuando las reglas de diseño lo requieran. Nunca permitas valores NaN, Infinity, recursos negativos por errores de cálculo o recompensas duplicadas. Valida las partidas importadas.

## 7. ECONOMÍA Y EDIFICIOS

La moneda principal es el PAPELERÍO (papeleo). Representa los documentos absurdos que la empresa produce y procesa.

La producción debe proceder de: clics manuales, edificios automáticos, mejoras, talentos, bonificaciones permanentes, efectos especiales y eventos.

### 7.1. Edificios iniciales

| Edificio | Coste base | Producción base/s | Factor de coste |
|---|---|---|---|
| Impresora de segunda mano | 15 | 0,2 | 1,15 |
| Becario sin contrato | 100 | 1 | 1,15 |
| Paloma contable | 1.100 | 8 | 1,15 |
| Clon del jefe | 12.000 | 50 | 1,15 |
| Reactor burocrático | 150.000 | 400 | 1,15 |

Costes mediante datos configurables. Fórmula: `coste = floor(costeBase * factorCrecimiento ^ cantidadPoseida)`. Compras por lotes calculan el total correctamente. No permitir comprar más de lo que puede pagarse.

### 7.2. Compras por lotes

Comprar ×1, ×10 y máximo. La opción máxima calcula la cantidad comprable sin producir saldos negativos.

### 7.3. Edificios futuros

Estructura ampliable para: Departamento de Recursos Inhumanos, Máquina de hacer reuniones, Clonadora de becarios, Impresora dimensional, Reactor de burocracia, Fábrica de universos, Departamento de paradojas, Servidor que contiene a Dios, Ministerio del Tiempo Perdido, Centro de Atención al Apocalipsis. Añadirlos no debe requerir reescribir el sistema de economía.

### 7.4. Multiplicadores

Función central que calcule la producción total combinando edificios, mejoras, talentos, prestigio y efectos temporales. Documenta la fórmula y evita multiplicar dos veces el mismo modificador.

## 8. MEJORAS

Mínimo 20 mejoras reales con: ID estable, nombre, descripción graciosa, coste, requisitos, categoría, efecto real, indicador visual de disponibilidad, estado de compra.

Categorías: Clics (Café de dudosa procedencia, Teclado mecánico de la prehistoria, Ratón con ansiedad, Formación en pulsar botones); Edificios (Impresora que amenaza al usuario, Becarios intercambiables, Palomas sindicalizadas, Clones con menos personalidad, Tinta procedente de otra dimensión); Producción global (Reuniones que generan reuniones, La productividad es una alucinación colectiva, El lunes ha sido despedido, El papeleo se imprime solo, La contabilidad es ilegal); Especiales (El jefe ahora es un holograma, Las leyes físicas han firmado un contrato, El tiempo se mide en formularios, El universo acepta pagos aplazados, La impresora imprime dinero pero solo en sentido metafórico).

Las mejoras deben afectar a la economía real. Requisitos para desbloquearlas; no todas disponibles desde el comienzo.

## 9. PROGRESIÓN Y DEPARTAMENTOS

Niveles corporativos: 1 El becario; 2 La explotación laboral (automatizaciones, palomas, primeras misiones); 3 Recursos Humanos del infierno (clones, sinergias, edificios potentes, árbol de talentos); 4 La multinacional interdimensional (prestigio, recursos avanzados, oficina ampliada); 5 Dios administrativo (edificios cósmicos, efectos especiales, objetivos finales).

Desbloqueos con requisitos verificables en configuraciones de datos. Cada departamento desbloquea una novedad mecánica.

## 10. LOGROS

Mínimo 20 logros (ID, nombre, descripción, condición, recompensa opcional, estado, marca temporal). Sistema de comprobación central y eficiente (no todo en cada fotograma). Recompensas una sola vez. Persisten tras reiniciar. Consultables (bloqueados/desbloqueados/requisitos). Notificaciones animadas.

## 11. ÁRBOL DE TALENTOS

Cuatro ramas: El vago profesional (clics y automatización), El explotador (edificios), El científico (glitches, temporales, offline), El villano (riesgo y recompensa). Mínimo 16 nodos reales con coste de Influencia, requisitos, efecto, descripción y estado (bloqueado/disponible/comprado). Algunos excluyentes. Árbol visual comprensible y navegable. Si hay reasignación, definir coste y condiciones.

## 12. PRESTIGIO Y REINICIOS

Moneda permanente: INFLUENCIA. Se reinicia papeleo, edificios, mejoras y progreso temporal definido. Se conservan logros, estadísticas históricas, Influencia, talentos, desbloqueos y bonificaciones permanentes.

Fórmula inicial: `Influencia = floor(sqrt(papeleoAcumuladoDelCiclo / 1_000_000))` (ajustable tras comprobarla).

Mostrar antes de reiniciar: influencia actual, ganada, total posterior, qué se reinicia y qué se conserva. Confirmación explícita. Reinicio atómico. Recalcular bonificaciones permanentes sin duplicarlas al cargar.

## 13. MISIONES Y EVENTOS

Misiones cortas con recompensas. Eventos aleatorios (Auditoría sorpresa, La impresora exige vacaciones, La paloma principal dimite, El jefe ha sido sustituido por su propio clon, El universo solicita una copia del formulario original, La máquina del café ha descubierto el libre albedrío) con consecuencias claras, nunca irreversibles, frecuencia controlada y opción de reducir interrupciones.

## 14. BUCLE DE JUEGO

Separar simulación económica, renderizado de interfaz y animación visual. Producción basada en delta de tiempo. Gestionar cambio de pestaña, suspensión, offline, cargas, reinicios y datos corruptos. Evitar actualizaciones innecesarias del DOM.

## 15. PARTÍCULAS Y ANIMACIONES

Sistema de partículas en Canvas 2D (crear, actualizar, gravedad, opacidad, eliminar caducadas, límite máximo, desactivable). Efectos: papeles, monedas, chispas, humo, brillos, confeti, mejoras importantes, ascenso. Movimiento CSS para personajes sencillos. Respetar prefers-reduced-motion y opción interna. Sin efectos, la economía funciona igual.

## 16. INTERFAZ Y NAVEGACIÓN

Barra superior (papeleo, producción/s, influencia, estado de guardado, ajustes). Panel izquierdo de edificios (nombre, icono, cantidad, producción, coste, botones). Panel central con oficina animada clicable. Panel derecho con mejoras, objetivos y notificaciones. Pestañas: Edificios, Mejoras, Talentos, Logros, Misiones, Prestigio, Estadísticas. Botones deshabilitados explican por qué. Precios impagables diferenciados. Tooltips no dependientes de hover.

## 17. RESPONSIVE Y ACCESIBILIDAD

Escritorio, tablet y móvil. Paneles como pestañas en móvil, botones táctiles, escena proporcional, cifras sin desbordes, notificaciones que no bloquean, árbol desplazable. Teclado, foco visible, etiquetas accesibles, contraste, reducir movimiento, desactivar partículas, sonido. No usar solo el color para indicar estado.

## 18. GUARDADO

localStorage versionado: autoguardado cada 10 s, al cambiar de pestaña, al salir, carga segura, copia del último guardado válido, exportar/importar JSON validado, migraciones. No confiar solo en beforeunload. Si la carga falla: recuperar copia, informar, no sobrescribir datos recuperables. README explica dónde se guarda y cómo exportar.

## 19. PROGRESO OFFLINE

Máximo inicial 8 horas. Calcular tiempo, limitar, calcular producción con fórmula (no miles de ticks), aplicar bonificaciones, mostrar resumen. Proteger contra fechas inválidas y cambios de reloj. Sin guardado válido no hay recompensa.

## 20. FORMATO DE NÚMEROS

950 · 1,25 mil · 1,4 M · 2,3 B · 5,6 T · mayores. Convención consistente en español. Precisión interna. Estrategia documentada para magnitudes extremas.

## 21. BALANCE

Primer edificio < 2 min; primera mejora relevante 2–5 min; automatización importante 10–20 min; primer departamento adicional 20–40 min; primer prestigio ~45–90 min; posteriores más rápidos. Simular y ajustar. Varias estrategias viables (clics, pasiva, equilibrada, talentos de prestigio). Evitar bloqueos; siempre una meta nueva.

## 22. PRUEBAS

Automatizadas para economía, mejoras, logros, talentos, prestigio, guardado, offline e interfaz (botones, pestañas, consola sin errores, responsive, ajustes). Usar navegador si está disponible. No inventar resultados.

## 23. SEGURIDAD Y ROBUSTEZ

Sin eval; sin innerHTML con datos no sanitizados; no confiar en datos del usuario; sin valores no finitos; sin bucles largos que bloqueen; importación de archivos enormes controlada; reinicio y guardado consistentes; aviso si localStorage falla.

## 24. FASES

1 Base ejecutable · 2 Núcleo incremental · 3 Interfaz · 4 Arte y animaciones · 5 Mejoras y departamentos · 6 Logros · 7 Talentos · 8 Prestigio · 9 Guardado · 10 Balance y acabado.

No te detengas tras la fase 1. Si no cabe en una sesión, deja el proyecto funcional, actualiza PLAN.md y continúa en la siguiente.

## 25. CRITERIOS DE ACEPTACIÓN

1. Arranca siguiendo el README. 2. Papeleo manual. 3. Producción automática. 4. Compras correctas. 5. Mejoras funcionan. 6. Departamentos se desbloquean. 7. Logros sin recompensas duplicadas. 8. Talentos funcionan. 9. Prestigio correcto. 10. Guardado y recuperación. 11. Exportar/importar. 12. Offline con límites. 13. Sprites y animaciones correctos. 14. Partículas desactivables. 15. Pantallas pequeñas. 16. Nada decorativo. 17. Pruebas ejecutadas y fallos corregidos. 18. Licencias documentadas. 19. Sin errores críticos conocidos. 20. Documentación de ejecución, pruebas y ampliación.

## 26. ENTREGA FINAL

Resumen con funcionalidades, estructura, recursos y licencias, comando de ejecución, pruebas y resultados reales, problemas conocidos, pendientes y próximas mejoras. No declarar completo lo que solo es visual. No eliminar funcionalidades para aparentar que está terminado.
