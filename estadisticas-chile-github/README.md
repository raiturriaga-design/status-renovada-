# ESTADÍSTICAS CHILE · V1

Aplicación web local para administrar equipos y jugadores, llevar partidos y consultar estadísticas acumuladas. No usa servicios externos, cuentas ni backend.

## Requisitos

- Node.js 20 o superior.

## Ejecutar

Desde esta carpeta, inicia el servidor local:

```powershell
npm start
```

Abre `http://localhost:4173` en el navegador. Para detenerlo, vuelve a la terminal y presiona `Ctrl+C`.

Para ejecutar las pruebas de las reglas estadísticas:

```powershell
npm test
```

## Datos

Los datos se guardan en `localStorage` del navegador en uso. Para conservarlos, usa el mismo navegador y no borres sus datos del sitio. Esta versión no sincroniza entre dispositivos.

## Estructura

- `src/pages/`: vistas de inicio, equipos, jugadores, partidos y ficha individual.
- `src/components/`: navegación y elementos reutilizables.
- `src/domain/`: reglas del partido y cálculos estadísticos.
- `src/data/`: almacenamiento local y estructura inicial.
- `src/utils/`: formato, validaciones y lectura de imágenes.

Las estadísticas acumuladas consideran partidos finalizados. Los minutos se registran con el reloj del partido y la alineación marcada en cancha.

## Publicar en GitHub Pages

Esta aplicación también puede servirse como sitio estático; GitHub Pages no necesita ejecutar `server.mjs`.

1. Crea un repositorio y sube el contenido de esta carpeta a la raíz, incluyendo `index.html` y la carpeta `src/`. No subas el ZIP como único archivo.
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, selecciona tu rama principal y la carpeta **/(root)**; luego guarda.
4. Abre la dirección publicada que muestra GitHub Pages.

Los datos siguen guardándose en `localStorage` del navegador. La versión publicada en GitHub Pages tendrá un almacenamiento separado del sitio local `localhost` y no sincronizará los datos entre personas o dispositivos.
