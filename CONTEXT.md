# Contexto del proyecto y decisiones

Este documento resume el trabajo y decisiones tomadas durante la conversación para construir y pulir la app.

## Objetivo
Crear un "juego de preguntas para parejas" como app web estática, usable offline, con mecánicas cómodas para una sesión a dos.

## Evolución de funcionalidades
- Base: preguntas aleatorias con filtros (categorías y nivel), sin repetición opcional, historial prev/next.
- Favoritas: marcar, listar, exportar/importar JSON y limpiar.
- Copiar/Compartir: portapapeles y Web Share API cuando está disponible.
- Temporizador: 30/60/120s con aviso sonoro al finalizar.
- Personalizar mazo: añade preguntas propias en lote, con categoría y nivel establecidos.
- Modo sesión (turnos):
  - Nombres de jugadores y cinta con turno actual y conteos.
  - "Siguiente" alterna turno y suma 1 al jugador correspondiente.
  - Elegir al azar quién empieza y terminar turno manualmente.
- Modo Retos (opcional):
  - Reto aleatorio con probabilidad (~50%) al mostrar nueva pregunta.
  - Botones para cambiar reto y para completarlo sumando +1/+2.
- Onboarding/UX:
  - Modal de Instrucciones al primer ingreso con "No volver a mostrar".
  - Modal de Nombres (Novia/Novio) con validación obligatoria y aviso persistente.
  - Sistema de toasts con variantes (info/success/warn/error) y duraciones ajustadas.
- Turn cue: burbuja animada "Turno: [Nombre]" + chime corto en cada cambio de turno.
- PWA: manifest + Service Worker con precache y runtime cache.

## Cambios recientes (ago 2025)
- Gating estricto del UI de turno:
  - La cinta “Turno:” y el modal de turno solo aparecen si `session.active` y `session.namesConfirmed` son verdaderos, y ambos nombres están completos (no vacíos); además, el nombre del turno actual no puede estar vacío.
  - Se eliminaron los placeholders “—” del HTML para evitar “Turno: —”.
- Inicio más robusto del modal de turno:
  - Se ocultan `#turnModal` y `#turnOverlay` inmediatamente tras obtener las referencias DOM (el script está al final del `<body>`).
  - Se retiró un IIFE de `DOMContentLoaded` que, encadenado tras un cierre de bloque, podía provocar `Uncaught TypeError: (intermediate value)(...) is not a function` en ciertos contextos.
- Service Worker endurecido y versionado:
  - `CACHE = 'qpair-cache-v13'`; `ASSETS` incluye `./js/main.js?v=14`.
  - Registro con `./sw.js?v=13` y recarga automática en `controllerchange`.
  - Filtro de `fetch`: solo `GET`, solo `http/https`, ignora `chrome-extension:`; cachea solo same-origin; fallback a `index.html` en navegación offline.
- Tema claro/oscuro:
  - Toggle con persistencia en `localStorage` (`qpair:theme`) y etiquetas con emoji.
- Señal de turno:
  - Burbuja más grande y chime breve ajustado.

## Decisiones y detalles técnicos
- Proyecto sin framework: HTML/CSS/JS puros.
- Datos:
  - `baseQuestions` con categorías ampliadas (Comunicación, Intimidad, Planes, Finanzas, etc.).
  - `challenges` para los retos con puntajes.
- Estado:
  - En memoria para mazo, filtros, cola, historial y tarjeta actual.
  - Persistencia en localStorage: favoritas (`qpair:favorites`) y sesión (`qpair:session`).
- Sesión y turnos:
  - `advanceTurn()` se ejecuta tras "Siguiente" en sesión.
  - `randomTurn()` y `endTurn()` cambian turno manualmente.
  - `renderSession()` actualiza cinta, nombres y puntajes.
  - `cueTurn()` muestra la burbuja y llama a `turnChime()`.
- UI defensiva:
  - `safeOn()` para evitar errores en escuchas de eventos.
  - `escapeHtml()` para render de favoritas.
- PWA y caché:
  - Versiónado de JS con `?v=N` y de SW con `CACHE='qpair-cache-vN'` para romper caché cuando hay cambios.

## Troubleshooting rápido
- Si ves UI de turno vacía al inicio: confirma que ambos nombres se hayan establecido en el modal de nombres y que “Comenzar” los haya guardado; de lo contrario, la cinta y el modal no aparecen por diseño.
- Si algún cambio no se refleja: recarga dura 1–2 veces para que el SW nuevo tome control; como alternativa, borra datos del sitio y vuelve a abrir.

## Cómo correr
- Recomendado (Service Worker activo):
  - `npx http-server -p 5501 -c-1 --silent` y abrir `http://localhost:5501`.
- Alternativa rápida:
  - Abrir `index.html` directamente (sin SW).

## Próximos posibles mejoras
- Ajustes finos del chime (volumen/tono) y opción para silenciar.
- Estadísticas de sesión (tiempo promedio por respuesta, etc.).
- Más mazos y opciones de curación.
