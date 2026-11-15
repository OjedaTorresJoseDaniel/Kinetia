# Datos pendientes para el backend de Kinetia

Revisión basada en el código exportado, no en una conexión a tu SQL Server. No se recuperó el último script de tu base de datos. Las ausencias en `src/types.ts` no prueban que esos campos falten en una base que hayas modificado por fuera. Ejecuta primero `01_inspeccionar_base.sql` para comparar.

## 1. Login y permisos

Actualmente se usa `Persona.Empleados.Num_Emp` y `Clave` con datos de prueba. `Tipo_Emp` solo distingue fisioterapeuta y recepción. Falta autenticar en un servidor y representar al propietario.

| Tabla propuesta | Campos | Finalidad |
| --- | --- | --- |
| `Seguridad.Rol` | `id_Rol`, `Nombre_Rol` único | Propietario, fisioterapeuta, recepción. |
| `Seguridad.Usuario` | `id_Usuario`, `id_Emp` único/FK, `Nombre_Usuario` único, `PasswordHash`, `id_Rol` FK, `Activo`, `Fecha_Creacion`, `Ultimo_Acceso`, `Intentos_Fallidos`, `Bloqueado_Hasta` | Separar la cuenta de acceso de los datos del empleado. |
| `Seguridad.Sesion` | `id_Sesion`, `id_Usuario` FK, `TokenHash` único, `Fecha_Creacion`, `Expira_En`, `Revocada_En` | Representar sesiones revocables si el backend adopta sesiones opacas. |

La propuesta usa un rol por cuenta: el propietario puede tener permisos clínicos y administrativos. Si después necesitas varios roles simultáneos por persona, sustituye `Usuario.id_Rol` por una relación UsuarioRol.

El backend debe generar y verificar el hash de contraseña con una biblioteca de autenticación, comprobar que usuario y empleado estén activos, limitar intentos de acceso y validar los permisos en cada operación. La tabla de sesiones es una opción de implementación; si usas ASP.NET Core Identity, adapta sus tablas y su gestión de sesiones en vez de duplicar credenciales. No copies `Clave` en texto normal a `PasswordHash` ni uses un SHA simple para contraseñas. No se crean usuarios ni claves por defecto en el SQL.

## 2. Tratamiento aplicado en una sesión

Ya existe `Catalogo.Tratamiento`. También existe en el modelo `Detalle.DetalleTrata`, que solo contiene `id_DetalleTrata` e `id_Trata`. El frontend genera actualmente un detalle por cada músculo.

Se propone agrupar los puntos en una aplicación del tratamiento:

| Campo en `Detalle.TratamientoAplicado` | Tipo propuesto | Uso |
| --- | --- | --- |
| `id_TratamientoAplicado` | int, PK | Identificador de esta aplicación. |
| `id_Diag` | int, FK | Diagnóstico/sesión al que pertenece. |
| `id_Trata` | int, FK | Tratamiento elegido del catálogo. |
| `id_UsuarioRegistro` | int, FK | Quién lo registró, tomado de la sesión autenticada. |
| `Fecha_Registro` | datetime2 | Fecha UTC de captura. |

Un diagnóstico admite muchos tratamientos y cada tratamiento muchos puntos. En la interfaz actual no se repite el mismo tratamiento dentro del mismo diagnóstico: se propone UNIQUE(id_Diag, id_Trata).

**Alternativas:** ampliar `DetalleTrata` y `DetalleCH`, o adoptar las tablas nuevas del SQL adjunto. El SQL muestra la segunda opción para no modificar datos históricos sin conocer tu esquema. Si se adopta, debe definirse una migración o vistas de compatibilidad para los reportes. No mantengas dos registros independientes del mismo hecho clínico.

## 3. Puntos editables del cuerpo

Actualmente `DetalleCH` conserva nombre, descripción, imagen, diagnóstico y tratamiento. En el editor existen `key`, `point`, `regionId` y `connections`, pero estos últimos no se mandan al guardado final.

| Campo en `Detalle.PuntoTratamiento` | Tipo propuesto | Uso |
| --- | --- | --- |
| `id_PuntoTratamiento` | int, PK | Identificador estable de la marca, distinto de la llave temporal de React. |
| `id_TratamientoAplicado` | int, FK | Tratamiento al que pertenece. |
| `Nombre_Musculo` | nvarchar(200) | Nombre mostrado. |
| `Codigo_Musculo` | nvarchar(128), NULL | Identificador de catálogo si existe; permite nombre libre. |
| `Descripcion` | nvarchar(2000) | Qué se realizó en esa zona. |
| `Imagen_Ref` | nvarchar(1024) | Ruta o clave del archivo asociado; no un enlace firmado que expire. |
| `Modelo` | char(1) | **H = hombre, M = mujer**, como `BodyMap.tsx`; no confundir con el género F/M del paciente. |
| `Vista` | char(1) | F frontal, P posterior, I lateral izquierdo, D lateral derecho. |
| `Pos_X`, `Pos_Y` | decimal(6,3) | Porcentajes de 0 a 100 dentro del marco de la figura. |
| `Version_Mapa` | varchar(64) | Identificador de la lámina y sus recortes; evita desplazar marcas si cambia la imagen. |

No se guardan píxeles de pantalla: así el zoom no cambia la ubicación. La versión del mapa es una mejora propuesta, todavía no está en el frontend. Debe conservarse también el archivo y la definición de recortes de cada versión.

## 4. Conexiones entre puntos

`Detalle.ConexionTratamiento` necesita `id_PuntoInicio`, `id_PuntoFin`, `id_TratamientoAplicado`, `Modelo`, `Vista` y `Version_Mapa`.

La propuesta de SQL usa llaves foráneas compuestas para que ambos extremos pertenezcan al mismo tratamiento, vista, modelo y mapa. Guarda el ID menor como inicio y el mayor como fin: evita conexiones a sí mismo y duplicados invertidos. Las conexiones actuales no tienen dirección clínica; los nombres inicio/fin identifican los extremos.

Ejemplo: puntos 15 y 16 pertenecen a Terapia manual de un diagnóstico. Una conexión 15–16 conserva el tramo. Otro punto de Punción seca sigue visible en el mismo cuerpo, pero pertenece a otra aplicación y no puede unirse a esa línea en el comportamiento actual.

## 5. Electrodos

`Detalle.DetalleElectrodo` aparece como **propuesto** en `src/types.ts`. Verifica si ya lo agregaste a tu SQL.

| Campo | Tipo propuesto | Uso |
| --- | --- | --- |
| `id_DetalleElectrodo` | int, PK | Identificador. |
| `id_Diag` | int, FK | Sesión. |
| `Modelo`, `Vista`, `Version_Mapa` | char(1), char(1), varchar(64) | Imagen utilizada. |
| `Zona` | nvarchar(200) | Nombre de la zona. |
| `Pos_X`, `Pos_Y` | decimal(6,3) | Ubicación entre 0 y 100. |
| `Frecuencia` | char(1) | Código B, M o A que usa la pantalla. |
| `Hz` | decimal(12,3), NULL | Valor numérico registrado en Hz. |
| `Voltaje` | decimal(9,3), NULL | Valor numérico registrado en V. |

Los tipos y las restricciones de este documento son de almacenamiento. No constituyen dosis ni rangos terapéuticos recomendados. No se agregan parámetros que la pantalla no recoge.

## 6. Identidad del negocio

`Configuracion.Negocio`: `id_Negocio`, `Nombre` nvarchar(80), `Lema` nvarchar(160) NULL, `LogoSistema_Ref` nvarchar(1024) NULL, `ImagenImpresion_Ref` nvarchar(1024) NULL, `EscalaLogo` decimal(4,2) de 1 a 3, `Actualizado_En` datetime2.

Se plantea un solo negocio, conforme a la aplicación actual. Los reportes deben consultar la identidad vigente al imprimir, como solicitaste. Si más adelante se ofrecen varios negocios, se necesitará relacionar usuarios y datos con cada negocio y aislar su acceso; eso no está implementado en esta entrega.

Actualmente esta identidad solo vive en localStorage. Las imágenes actuales son data URLs; al integrar el backend deben subirse a almacenamiento persistente y guardar su referencia, con un endpoint autorizado para recuperarlas.

## 7. Ejercicios, descripciones y dolor

| Tabla/campo existente | Ajuste por revisar |
| --- | --- |
| `Ejercicio.Ejercicios.Imagen_Ejercicio` | Figura como propuesto. Al usar archivos, agregar referencia nvarchar(1024) o equivalente. |
| `Ejercicio.Ejercicios.id_CatEjer` | Figura como propuesto. FK nullable hacia `Ejercicio.CatEjercicio`. |
| `Ejercicio.Ejercicios.Ejercicio` | Confirmar si representa descripción/instrucciones; ampliar a nvarchar(2000). La pantalla actual aún limita este campo a 50 caracteres: también hay que ampliar el control. |
| `Detalle.DetalleCH.Descripcion_DiagCH` | Revisar longitud para permitir observaciones por zona; propuesta nvarchar(2000). Ya existe, no se debe duplicar. |
| `Catalogo.EscalaDolor.Valor_Escala` | Está documentado como char(1), y el mock actual contiene 0–9. Si se decide usar 0–10, cambiar a tinyint con CHECK 0–10 y agregar el valor 10 sin renumerar IDs referenciados. |
| `Ejercicio.DetalleEjer.Series` y `Repeticiones` | Ya existen por diagnóstico; no hace falta otra tabla para esos campos. |

Estos cambios de tablas existentes **no se ejecutan** en el SQL de tablas nuevas, porque falta revisar tipos, índices y datos originales. El script de inspección ayuda a preparar después una migración específica.

## 8. Integración que falta en el código

1. Sustituir `AuthContext` por llamadas al backend; el login actual no proporciona seguridad para datos reales. Retirar cuentas de ejemplo en producción y revisar el límite de 15 caracteres de la contraseña en `Login.tsx`.
2. Sustituir el almacén en memoria de `DataContext` por lectura y escritura mediante API.
3. En `DiagnosticoNuevo`, incluir coordenadas, modelo, vista y conexiones en el envío. Asignar IDs persistentes y mapear las llaves temporales al insertar.
4. Guardar diagnóstico, detalles, tratamientos, puntos, líneas y electrodos en una transacción: todo se confirma o todo se revierte.
5. Al finalizar un diagnóstico, exigir al menos un tratamiento y una zona completa por tratamiento; nombre, descripción e imagen son obligatorios. Una FK no garantiza por sí sola que exista al menos un hijo: el servidor debe comprobarlo.
6. Reconstruir el mapa al consultar el registro. Leer solo las imágenes guardadas no recupera los puntos editables.
7. Adaptar consultas de historial y ejercicios a las tablas definitivas. Validar permisos de lectura y escritura en el backend.

## Orden de trabajo

Primero comparar el SQL original con esta propuesta; después implementar autenticación y API; finalmente conectar los formularios y verificar que un registro conserve sus puntos, conexiones e imágenes después de cerrar y volver a abrir la aplicación.

Referencia oficial si eliges ASP.NET Core Identity: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity . La tecnología del backend todavía no se ha fijado en este ZIP.
