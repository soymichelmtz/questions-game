# Juego de Preguntas para Parejas

App web estática (HTML/CSS/JS) para conversar en pareja con preguntas al azar, filtros, favoritos, modo sesión con turnos, retos con puntos, PWA offline, y personalización.

## Características principales
- Preguntas por categorías y nivel (ligero, profundo, reflexivo).
- Sin repetición hasta agotar (opcional), historial anterior/siguiente.
- Favoritas con guardado local (localStorage), exportar/importar JSON.
- Copiar/Compartir la pregunta actual (Web Share si está disponible).
- Temporizador opcional (30/60/120 s) con alerta sonora.
- Personalizar: añadir tus propias preguntas por lote.

## Modo sesión (turnos) y Retos
- Nombres de jugadores y cinta superior con “Turno: [Nombre]” y conteos.
- “Siguiente” alterna el turno y suma 1 a quien responde.
- “Elegir al azar” elige quién comienza; “Terminar turno” cambia manualmente.
- Modo Retos (opcional): aparece a veces un reto con puntos extra (+1/+2), con opciones para cambiar reto o completarlo y sumar puntos.
- Señal visual y sonora del turno: burbuja animada “Turno: [Nombre]” + chime breve.

## Onboarding y UX
- Modal de instrucciones al primer ingreso (con “No volver a mostrar”).
- Modal de nombres (Novia/Novio) al comenzar, con validación obligatoria y aviso persistente hasta completar.
- Sistema de toasts con variantes: info/success/warn/error y duraciones ajustadas.

## PWA y caché
- manifest.json y Service Worker (`sw.js`) con precache y runtime cache.
- Para forzar actualización tras cambios: recarga dura 1-2 veces.

## Ejecutar localmente
Aunque es estática y puede abrirse con doble click, se recomienda servir por HTTP para que el Service Worker funcione:

PowerShell (Windows):

```powershell
# En la carpeta del proyecto
npx --yes http-server -p 5501 -c-1 --silent
# Abre http://localhost:5501
```

Alternativa: abrir `index.html` directamente en el navegador si no necesitas SW.

## Estructura de archivos
- `index.html`: UI principal y modales (instrucciones, nombres, turno).
- `style.css`: estilos, toasts, burbuja de turno y animaciones.
- `main.js`: lógica del juego (filtros, cola sin repetición, historial, favoritas, temporizador, sesión/retos, modales, toasts, chime de turno, PWA init).
- `sw.js`: cacheo offline (ver `CACHE` y assets precacheados).
- `manifest.json`: metadatos PWA.

## Notas técnicas
- Identificadores de preguntas aleatorios vía `crypto.getRandomValues` cuando está disponible.
- Persiste: favoritas (`qpair:favorites`) y sesión (`qpair:session`).
- Evita errores por elementos faltantes con `safeOn`.
- Control de caché: versión del JS vía `?v=N` y bump del `CACHE` en `sw.js`.

## Licencia
Uso personal; puedes editar el contenido a tu gusto.
