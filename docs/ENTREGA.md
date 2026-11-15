# Registro de esta entrega

- Fuente: Kinetia, versión publicada 29.
- Commit de origen: `624a01b868a12075745ba021d1cc9a32e6f2778c`.
- Los archivos de `src/` y `public/` se conservaron byte por byte.
- Configuración Vite simplificada para localhost, sin herramientas específicas de Figma/hosting.
- HTML configurado en español con título e icono del sistema.
- Dependencias directas fijadas. React y React DOM se ajustaron de 19.2.4 a 19.2.7 para cumplir los peer dependencies publicados de react-router 8.4.0.
- Se generó package-lock.json para instalar con npm ci.
- Se añadieron documentación, espacio de trabajo VS Code, lanzador Windows y propuesta SQL. No se cambió la versión del sitio publicado.

## Verificaciones

- Instalación de dependencias completada.
- TypeScript: sin errores.
- Compilación Vite: completada.
- Advertencia de tamaño: el paquete JS principal supera 500 kB sin comprimir; no impide compilar ni iniciar.
- El proyecto se verificó en Linux con Node.js 24.22.1. El lanzador de Windows se incluye como ayuda y no se ejecutó en Windows.
- Esta exportación no incluye una nueva prueba visual completa en navegador.
- El SQL se entrega como propuesta revisable: no se probó en un motor SQL Server ni contra tu base original.

## Alcance

La entrega permite continuar el frontend en un editor. La API, la autenticación real, la persistencia de los datos clínicos y la migración verificada de la base siguen pendientes. Los datos de demostración no reemplazan una copia de seguridad.

## Archivos de terceros

Se conserva `public/anatomy/ATTRIBUTION.txt` del proyecto original. Ese aviso también describe recursos de prototipos anteriores: no implica que sus modelos 3D estén incluidos aquí. La aplicación actual usa las láminas 2D de `src/assets/cuerpo/` y el catálogo de nombres incluido en `src/data/`.
