# Plano interactivo para LumenHogar

Este complemento fue creado aparte y no modifica tus archivos originales.

## Archivos

- `lumenhogar-web.html`: acceso rapido con el nombre nuevo de la pagina.
- `eco-consumo-web.html`: pagina principal completa.
- `eco-mapa3d.css`: estilos del apartado.
- `eco-mapa3d.js`: logica del plano interactivo, aparatos y recomendaciones.
- `eco-mapa3d-seccion.html`: bloque minimo para pegar despues en tu pagina.

## Como probarlo ahora

1. Abre `lumenhogar-web.html` en tu navegador.
2. Agrega aparatos, selecciona habitacion y revisa el plano.
3. Observa como cambian las recomendaciones conforme aumenta el consumo.

## Si despues quieres integrarlo a tu pagina original

1. Enlaza `eco-mapa3d.css`.
2. Enlaza `eco-mapa3d.js`.
3. Pega el contenido de `eco-mapa3d-seccion.html` dentro de tu pagina.
4. Si quieres verlo como una seccion navegable, agrega un boton en tu menu lateral que llame a `mostrar('mapa3d')`.

## Nota util

Cuando este apartado viva dentro de la misma pagina principal, el boton `Importar inventario` intentara leer la lista de aparatos ya registrada para dibujarla automaticamente en el plano.
