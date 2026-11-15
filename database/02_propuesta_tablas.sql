/*
 KINETIA - PROPUESTA PARA REVISAR, NO MIGRACION DEL ESQUEMA ORIGINAL.
 SQL Server. No fue ejecutada contra tu base.

 Por defecto termina sin modificar nada. Para probarla en una copia de desarrollo,
 compara primero 01_inspeccionar_base.sql y cambia @CrearPropuesta a 1.

 Requiere tablas originales:
 Persona.Empleados(id_Emp INT PK/UNIQUE)
 Persona.Diagnostico(id_Diag INT PK/UNIQUE)
 Catalogo.Tratamiento(id_Trata INT PK/UNIQUE)

 Crea tablas nuevas. No copia datos ni cambia DetalleCH/DetalleTrata.
 La adopcion de TratamientoAplicado/PuntoTratamiento requiere adaptar el backend
 y los reportes; no mantener dos registros independientes del mismo tratamiento.
 No crea cuentas ni contrasenas por defecto. No conecta el frontend a SQL.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @CrearPropuesta bit = 0;
IF @CrearPropuesta = 0
BEGIN
    PRINT N'Propuesta solamente. Revisa DATOS_FALTANTES.md y el esquema original antes de aplicarla en una copia de desarrollo.';
    RETURN;
END;

IF DB_NAME() IN ('master','model','msdb','tempdb')
    THROW 51000, N'Selecciona una base de desarrollo de Kinetia.', 1;

IF OBJECT_ID(N'Persona.Empleados', N'U') IS NULL
   OR OBJECT_ID(N'Persona.Diagnostico', N'U') IS NULL
   OR OBJECT_ID(N'Catalogo.Tratamiento', N'U') IS NULL
    THROW 51001, N'Faltan tablas originales. Este archivo no crea la base completa.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'Persona.Empleados') AND name='id_Emp' AND system_type_id=56)
   OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'Persona.Diagnostico') AND name='id_Diag' AND system_type_id=56)
   OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'Catalogo.Tratamiento') AND name='id_Trata' AND system_type_id=56)
    THROW 51002, N'Los identificadores originales no coinciden con los INT esperados. Revisa el esquema.', 1;

IF OBJECT_ID(N'Seguridad.Rol') IS NOT NULL
   OR OBJECT_ID(N'Seguridad.Usuario') IS NOT NULL
   OR OBJECT_ID(N'Seguridad.Sesion') IS NOT NULL
   OR OBJECT_ID(N'Configuracion.Negocio') IS NOT NULL
   OR OBJECT_ID(N'Detalle.TratamientoAplicado') IS NOT NULL
   OR OBJECT_ID(N'Detalle.PuntoTratamiento') IS NOT NULL
   OR OBJECT_ID(N'Detalle.ConexionTratamiento') IS NOT NULL
   OR OBJECT_ID(N'Detalle.DetalleElectrodo') IS NOT NULL
    THROW 51003, N'Ya existen objetos de la propuesta. Comparalos; no se sobrescriben.', 1;

BEGIN TRY
    BEGIN TRANSACTION;
    IF SCHEMA_ID(N'Seguridad') IS NULL EXEC(N'CREATE SCHEMA Seguridad AUTHORIZATION dbo;');
    IF SCHEMA_ID(N'Configuracion') IS NULL EXEC(N'CREATE SCHEMA Configuracion AUTHORIZATION dbo;');
    IF SCHEMA_ID(N'Detalle') IS NULL EXEC(N'CREATE SCHEMA Detalle AUTHORIZATION dbo;');

    CREATE TABLE Seguridad.Rol (
        id_Rol int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Kin_Rol PRIMARY KEY,
        Nombre_Rol nvarchar(40) COLLATE Latin1_General_100_CI_AS NOT NULL,
        CONSTRAINT UQ_Kin_Rol_Nombre UNIQUE(Nombre_Rol),
        CONSTRAINT CK_Kin_Rol_Nombre CHECK(LEN(LTRIM(RTRIM(Nombre_Rol)))>0)
    );

    CREATE TABLE Seguridad.Usuario (
        id_Usuario int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Kin_Usuario PRIMARY KEY,
        id_Emp int NOT NULL,
        Nombre_Usuario nvarchar(100) COLLATE Latin1_General_100_CI_AS NOT NULL,
        PasswordHash nvarchar(512) NOT NULL,
        id_Rol int NOT NULL,
        Activo bit NOT NULL CONSTRAINT DF_Kin_Usuario_Activo DEFAULT(1),
        Fecha_Creacion datetime2(3) NOT NULL CONSTRAINT DF_Kin_Usuario_Fecha DEFAULT(SYSUTCDATETIME()),
        Ultimo_Acceso datetime2(3) NULL,
        Intentos_Fallidos int NOT NULL CONSTRAINT DF_Kin_Usuario_Intentos DEFAULT(0),
        Bloqueado_Hasta datetime2(3) NULL,
        CONSTRAINT UQ_Kin_Usuario_Empleado UNIQUE(id_Emp),
        CONSTRAINT UQ_Kin_Usuario_Nombre UNIQUE(Nombre_Usuario),
        CONSTRAINT FK_Kin_Usuario_Empleado FOREIGN KEY(id_Emp) REFERENCES Persona.Empleados(id_Emp),
        CONSTRAINT FK_Kin_Usuario_Rol FOREIGN KEY(id_Rol) REFERENCES Seguridad.Rol(id_Rol),
        CONSTRAINT CK_Kin_Usuario_Nombre CHECK(LEN(LTRIM(RTRIM(Nombre_Usuario)))>0),
        CONSTRAINT CK_Kin_Usuario_Hash CHECK(LEN(LTRIM(RTRIM(PasswordHash)))>0),
        CONSTRAINT CK_Kin_Usuario_Intentos CHECK(Intentos_Fallidos>=0)
    );

    /* Opcion de sesiones opacas. No duplica tablas de un proveedor de identidad.
       El token aleatorio original se entrega en cookie segura desde el backend;
       aqui se conserva su hash. PasswordHash usa un algoritmo de contrasenas. */
    CREATE TABLE Seguridad.Sesion (
        id_Sesion uniqueidentifier NOT NULL CONSTRAINT DF_Kin_Sesion_Id DEFAULT(NEWID()) CONSTRAINT PK_Kin_Sesion PRIMARY KEY,
        id_Usuario int NOT NULL,
        TokenHash binary(32) NOT NULL,
        Fecha_Creacion datetime2(3) NOT NULL CONSTRAINT DF_Kin_Sesion_Fecha DEFAULT(SYSUTCDATETIME()),
        Expira_En datetime2(3) NOT NULL,
        Revocada_En datetime2(3) NULL,
        CONSTRAINT UQ_Kin_Sesion_Hash UNIQUE(TokenHash),
        CONSTRAINT FK_Kin_Sesion_Usuario FOREIGN KEY(id_Usuario) REFERENCES Seguridad.Usuario(id_Usuario),
        CONSTRAINT CK_Kin_Sesion_Expira CHECK(Expira_En>Fecha_Creacion),
        CONSTRAINT CK_Kin_Sesion_Revocada CHECK(Revocada_En IS NULL OR Revocada_En>=Fecha_Creacion)
    );
    CREATE INDEX IX_Kin_Sesion_Usuario ON Seguridad.Sesion(id_Usuario,Expira_En);

    CREATE TABLE Configuracion.Negocio (
        id_Negocio tinyint NOT NULL CONSTRAINT PK_Kin_Negocio PRIMARY KEY,
        Nombre nvarchar(80) NOT NULL,
        Lema nvarchar(160) NULL,
        LogoSistema_Ref nvarchar(1024) NULL,
        ImagenImpresion_Ref nvarchar(1024) NULL,
        EscalaLogo decimal(4,2) NOT NULL CONSTRAINT DF_Kin_Negocio_Escala DEFAULT(1),
        Actualizado_En datetime2(3) NOT NULL CONSTRAINT DF_Kin_Negocio_Fecha DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT CK_Kin_Negocio_Unico CHECK(id_Negocio=1),
        CONSTRAINT CK_Kin_Negocio_Nombre CHECK(LEN(LTRIM(RTRIM(Nombre)))>0),
        CONSTRAINT CK_Kin_Negocio_Escala CHECK(EscalaLogo BETWEEN 1 AND 3)
    );
    /* El backend debe actualizar Actualizado_En en cada cambio. */

    CREATE TABLE Detalle.TratamientoAplicado (
        id_TratamientoAplicado int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Kin_TratamientoAplicado PRIMARY KEY,
        id_Diag int NOT NULL,
        id_Trata int NOT NULL,
        id_UsuarioRegistro int NOT NULL,
        Fecha_Registro datetime2(3) NOT NULL CONSTRAINT DF_Kin_Tratamiento_Fecha DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT UQ_Kin_Tratamiento_DiagTipo UNIQUE(id_Diag,id_Trata),
        CONSTRAINT FK_Kin_Tratamiento_Diag FOREIGN KEY(id_Diag) REFERENCES Persona.Diagnostico(id_Diag),
        CONSTRAINT FK_Kin_Tratamiento_Tipo FOREIGN KEY(id_Trata) REFERENCES Catalogo.Tratamiento(id_Trata),
        CONSTRAINT FK_Kin_Tratamiento_Usuario FOREIGN KEY(id_UsuarioRegistro) REFERENCES Seguridad.Usuario(id_Usuario)
    );

    CREATE TABLE Detalle.PuntoTratamiento (
        id_PuntoTratamiento int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Kin_PuntoTratamiento PRIMARY KEY,
        id_TratamientoAplicado int NOT NULL,
        Nombre_Musculo nvarchar(200) NOT NULL,
        Codigo_Musculo nvarchar(128) NULL,
        Descripcion nvarchar(2000) NOT NULL,
        Imagen_Ref nvarchar(1024) NOT NULL,
        Modelo char(1) NOT NULL,
        Vista char(1) NOT NULL,
        Pos_X decimal(6,3) NOT NULL,
        Pos_Y decimal(6,3) NOT NULL,
        Version_Mapa varchar(64) NOT NULL,
        CONSTRAINT FK_Kin_Punto_Tratamiento FOREIGN KEY(id_TratamientoAplicado) REFERENCES Detalle.TratamientoAplicado(id_TratamientoAplicado),
        CONSTRAINT UQ_Kin_Punto_Contexto UNIQUE(id_PuntoTratamiento,id_TratamientoAplicado,Modelo,Vista,Version_Mapa),
        CONSTRAINT CK_Kin_Punto_Modelo CHECK(Modelo IN ('H','M')),
        CONSTRAINT CK_Kin_Punto_Vista CHECK(Vista IN ('F','P','I','D')),
        CONSTRAINT CK_Kin_Punto_Posicion CHECK(Pos_X BETWEEN 0 AND 100 AND Pos_Y BETWEEN 0 AND 100),
        CONSTRAINT CK_Kin_Punto_Nombre CHECK(LEN(LTRIM(RTRIM(Nombre_Musculo)))>0),
        CONSTRAINT CK_Kin_Punto_Descripcion CHECK(LEN(LTRIM(RTRIM(Descripcion)))>0),
        CONSTRAINT CK_Kin_Punto_Imagen CHECK(LEN(LTRIM(RTRIM(Imagen_Ref)))>0),
        CONSTRAINT CK_Kin_Punto_Mapa CHECK(LEN(LTRIM(RTRIM(Version_Mapa)))>0)
    );
    CREATE INDEX IX_Kin_Punto_Tratamiento ON Detalle.PuntoTratamiento(id_TratamientoAplicado);

    CREATE TABLE Detalle.ConexionTratamiento (
        id_PuntoInicio int NOT NULL,
        id_PuntoFin int NOT NULL,
        id_TratamientoAplicado int NOT NULL,
        Modelo char(1) NOT NULL,
        Vista char(1) NOT NULL,
        Version_Mapa varchar(64) NOT NULL,
        CONSTRAINT PK_Kin_Conexion PRIMARY KEY(id_PuntoInicio,id_PuntoFin),
        CONSTRAINT CK_Kin_Conexion_Orden CHECK(id_PuntoInicio<id_PuntoFin),
        CONSTRAINT FK_Kin_Conexion_Inicio FOREIGN KEY(id_PuntoInicio,id_TratamientoAplicado,Modelo,Vista,Version_Mapa)
            REFERENCES Detalle.PuntoTratamiento(id_PuntoTratamiento,id_TratamientoAplicado,Modelo,Vista,Version_Mapa),
        CONSTRAINT FK_Kin_Conexion_Fin FOREIGN KEY(id_PuntoFin,id_TratamientoAplicado,Modelo,Vista,Version_Mapa)
            REFERENCES Detalle.PuntoTratamiento(id_PuntoTratamiento,id_TratamientoAplicado,Modelo,Vista,Version_Mapa)
    );
    CREATE INDEX IX_Kin_Conexion_Fin ON Detalle.ConexionTratamiento(id_PuntoFin);
    CREATE INDEX IX_Kin_Conexion_Tratamiento ON Detalle.ConexionTratamiento(id_TratamientoAplicado);

    CREATE TABLE Detalle.DetalleElectrodo (
        id_DetalleElectrodo int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Kin_DetalleElectrodo PRIMARY KEY,
        id_Diag int NOT NULL,
        Modelo char(1) NOT NULL,
        Vista char(1) NOT NULL,
        Version_Mapa varchar(64) NOT NULL,
        Zona nvarchar(200) NOT NULL,
        Pos_X decimal(6,3) NOT NULL,
        Pos_Y decimal(6,3) NOT NULL,
        Frecuencia char(1) NOT NULL,
        Hz decimal(12,3) NULL,
        Voltaje decimal(9,3) NULL,
        CONSTRAINT FK_Kin_Electrodo_Diag FOREIGN KEY(id_Diag) REFERENCES Persona.Diagnostico(id_Diag),
        CONSTRAINT CK_Kin_Electrodo_Modelo CHECK(Modelo IN ('H','M')),
        CONSTRAINT CK_Kin_Electrodo_Vista CHECK(Vista IN ('F','P','I','D')),
        CONSTRAINT CK_Kin_Electrodo_Mapa CHECK(LEN(LTRIM(RTRIM(Version_Mapa)))>0),
        CONSTRAINT CK_Kin_Electrodo_Zona CHECK(LEN(LTRIM(RTRIM(Zona)))>0),
        CONSTRAINT CK_Kin_Electrodo_Posicion CHECK(Pos_X BETWEEN 0 AND 100 AND Pos_Y BETWEEN 0 AND 100),
        CONSTRAINT CK_Kin_Electrodo_Frecuencia CHECK(Frecuencia IN ('B','M','A')),
        CONSTRAINT CK_Kin_Electrodo_Hz CHECK(Hz IS NULL OR Hz>=0),
        CONSTRAINT CK_Kin_Electrodo_Voltaje CHECK(Voltaje IS NULL OR Voltaje>=0)
    );
    CREATE INDEX IX_Kin_Electrodo_Diag ON Detalle.DetalleElectrodo(id_Diag);

    INSERT INTO Seguridad.Rol(Nombre_Rol)
    VALUES(N'propietario'),(N'fisioterapeuta'),(N'recepcion');

    COMMIT TRANSACTION;
    PRINT N'Tablas propuestas creadas. Faltan la migracion de datos, los ajustes de tablas existentes y la API. No se crearon usuarios.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

/*
 Para eliminar una marca, el backend elimina primero sus conexiones y despues
 el punto, en la misma transaccion. No hay borrado en cascada de historia clinica.

 AJUSTES DE TABLAS EXISTENTES PENDIENTES DE VALIDAR (no ejecutados aqui):
 - Imagen_Ejercicio e id_CatEjer en Ejercicio.Ejercicios, si no existen.
 - Longitud de Ejercicios.Ejercicio y DetalleCH.Descripcion_DiagCH.
 - Valor_Escala numerico y valor 10, solo si se adopta escala 0-10.
 - Migrar o sustituir DetalleTrata/DetalleCH, adaptando consultas/reportes.
 - Asegurar al menos una zona completa por tratamiento al finalizar la sesion.
*/
