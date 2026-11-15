# Kinetia · Sistema de fisioterapia

Código fuente de la versión publicada, preparado para abrir en Visual Studio Code u otro editor.

## Empezar en Windows

1. Instala **Node.js 24 LTS** (incluye npm): https://nodejs.org/en/download . También se admite Node.js 22.22 o superior.
2. Extrae todo el ZIP. No ejecutes los archivos dentro del comprimido.
3. Abre la carpeta **Kinetia** en Visual Studio Code: Archivo → Abrir carpeta. También puedes abrir `Kinetia.code-workspace`.
4. Abre Terminal → Nueva terminal y ejecuta:

```sh
npm ci
npm run dev
```

5. Abre **http://localhost:5173**. Mantén la terminal abierta. Para detenerlo, pulsa Ctrl+C.

La primera instalación necesita Internet. No necesitas SQL Server, Docker ni una cuenta de Figma para probar esta versión.
Si PowerShell bloquea `npm.ps1`, usa `npm.cmd ci` y `npm.cmd run dev`, o elige la terminal Símbolo del sistema. No necesitas cambiar la política de seguridad de Windows.

También se incluye `INICIAR_WINDOWS.cmd`: instala las dependencias si faltan e inicia la aplicación. Node.js debe estar instalado previamente.

## Acceso de demostración

| Perfil | Número de empleado | Clave de prueba |
| --- | --- | --- |
| Fisioterapeuta | 1001 | fisio123 |
| Recepción | 2001 | recep123 |

Estas cuentas están en `src/data/mock.ts` y se muestran en la pantalla de login. Son datos de demostración; no son cuentas de una base de datos real.

## Qué incluye

- Pacientes, empleados, citas, agenda, consultorios y catálogos.
- Diagnóstico con lesiones, dolor, músculos, tratamientos, electrodos y ejercicios.
- Cuerpo 2D con zoom, puntos de todos los tratamientos visibles en una misma vista, colores y conexiones al pasar el cursor.
- Historial clínico imprimible y reporte separado de ejercicios.
- Identidad del negocio con nombre, lema, logo e imagen para impresiones separados.
- Tema claro y oscuro.
- Documento de campos faltantes y scripts SQL de inspección y propuesta.

## Estado real de esta entrega

Es el **frontend funcional de demostración**, no un sistema terminado con backend. El login compara los datos de prueba en el navegador. Los pacientes, citas y diagnósticos nuevos viven en memoria y se reinician al recargar. La identidad del negocio se guarda en localStorage y la sesión de prueba en sessionStorage; no se sincronizan entre equipos.

Las coordenadas y conexiones de tratamientos todavía no se incluyen en el guardado final del diagnóstico. La imagen conserva su representación, pero falta persistir los puntos como datos editables. El modelo H/M del mapa de electrodos también debe conservarse en el backend. Estos pendientes se detallan en `database/DATOS_FALTANTES.md`.

Las imágenes del cuerpo y el catálogo muscular están incluidos. Las fotografías de ejemplo y la fuente Manrope se solicitan a servicios externos; sin Internet puede cambiar la tipografía y faltar alguna fotografía de ejemplo.

## Base de datos

Empieza por `database/DATOS_FALTANTES.md`.

- `01_inspeccionar_base.sql`: consultas de solo lectura para revisar tu esquema SQL Server.
- `02_propuesta_tablas.sql`: diseño de tablas nuevas con relaciones y restricciones. Por defecto solo muestra un aviso y termina. Es una propuesta, no una migración verificada contra tu último SQL.

No hace falta ejecutar SQL para abrir el frontend. No se incluye el respaldo de tu base original porque no estaba disponible para esta exportación. El SQL propuesto no conecta automáticamente el frontend.

## Comandos

| Comando | Función |
| --- | --- |
| `npm ci` | Instalar las versiones fijadas en package-lock.json. |
| `npm run dev` | Desarrollar con actualización automática en puerto 5173. |
| `npm run check` | Revisar tipos de TypeScript. |
| `npm run build` | Revisar tipos y generar dist/. |
| `npm run preview` | Servir dist/ en http://localhost:4173 después de compilar. |

No abras `index.html` con doble clic ni uses Live Server: este proyecto necesita Vite para procesar TypeScript, React y Tailwind.
Si el puerto 5173 ya está ocupado, detén la otra instancia o usa `npm run dev -- --port 5174` y abre la dirección indicada.

## Archivos para continuar el desarrollo

| Ruta | Contenido |
| --- | --- |
| `src/pages/` | Pantallas del sistema. |
| `src/components/MuscleEditor.tsx` | Mapa de músculos, tratamientos y conexiones. |
| `src/components/BodyMap.tsx` | Cuerpo, posiciones, imágenes y electrodos. |
| `src/context/DataContext.tsx` | Datos en memoria; punto principal para integrar la API. |
| `src/context/AuthContext.tsx` | Login simulado que debe sustituirse por autenticación de servidor. |
| `src/context/BusinessContext.tsx` | Nombre, lema y logos. |
| `src/types.ts` | Tipos actuales; algunos campos están marcados como propuestos. |
| `src/data/mock.ts` | Datos de ejemplo. |
| `src/assets/cuerpo/` | Imágenes anatómicas. |
| `docs/ENTREGA.md` | Procedencia, ajustes de portabilidad y comprobaciones. |

No se incluye `node_modules`: npm lo genera para el sistema operativo de tu equipo. Tampoco se incluyen credenciales del alojamiento ni historial Git. Para guardar tu propio historial puedes iniciar un repositorio desde esta carpeta.
