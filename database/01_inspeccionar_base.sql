/* SQL Server. Selecciona tu base en SSMS antes de ejecutar.
   SOLO LECTURA: muestra estructura; no modifica tablas ni consulta pacientes. */
SET NOCOUNT ON;
SELECT DB_NAME() AS BaseActual;

SELECT s.name AS Esquema, t.name AS Tabla, c.column_id AS Orden,
       c.name AS Columna, ty.name AS Tipo,
       CASE WHEN c.max_length = -1 THEN -1
            WHEN ty.name IN ('nvarchar','nchar') THEN c.max_length / 2
            ELSE c.max_length END AS Longitud,
       c.precision AS PrecisionNumerica, c.scale AS Decimales,
       c.is_nullable AS PermiteNull, c.is_identity AS EsIdentity,
       dc.definition AS ValorPredeterminado
FROM sys.tables AS t
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
JOIN sys.columns AS c ON c.object_id = t.object_id
JOIN sys.types AS ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints AS dc ON dc.object_id = c.default_object_id
WHERE s.name IN ('Persona','Catalogo','Detalle','Ejercicio','Ubicacion','Lesion','Seguridad','Configuracion')
ORDER BY s.name,t.name,c.column_id;

SELECT fk.name AS Relacion,
       OBJECT_SCHEMA_NAME(fk.parent_object_id) AS EsquemaOrigen,
       OBJECT_NAME(fk.parent_object_id) AS TablaOrigen,
       pc.name AS ColumnaOrigen,
       OBJECT_SCHEMA_NAME(fk.referenced_object_id) AS EsquemaDestino,
       OBJECT_NAME(fk.referenced_object_id) AS TablaDestino,
       rc.name AS ColumnaDestino,
       fk.delete_referential_action_desc AS AlBorrar,
       fk.is_disabled AS Deshabilitada, fk.is_not_trusted AS SinValidar
FROM sys.foreign_keys AS fk
JOIN sys.foreign_key_columns AS fkc ON fkc.constraint_object_id=fk.object_id
JOIN sys.columns AS pc ON pc.object_id=fk.parent_object_id AND pc.column_id=fkc.parent_column_id
JOIN sys.columns AS rc ON rc.object_id=fk.referenced_object_id AND rc.column_id=fkc.referenced_column_id
ORDER BY EsquemaOrigen,TablaOrigen,Relacion,fkc.constraint_column_id;

SELECT OBJECT_SCHEMA_NAME(i.object_id) AS Esquema,
       OBJECT_NAME(i.object_id) AS Tabla, i.name AS Indice,
       i.is_primary_key AS EsPK, i.is_unique AS EsUnico,
       c.name AS Columna, ic.key_ordinal AS Orden, i.filter_definition AS Filtro
FROM sys.indexes AS i
JOIN sys.index_columns AS ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
JOIN sys.columns AS c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
WHERE i.is_hypothetical=0 AND i.index_id>0 AND OBJECTPROPERTY(i.object_id,'IsUserTable')=1
ORDER BY Esquema,Tabla,Indice,Orden;

SELECT OBJECT_SCHEMA_NAME(parent_object_id) AS Esquema,
       OBJECT_NAME(parent_object_id) AS Tabla, name AS Restriccion,
       definition AS Regla, is_disabled AS Deshabilitada, is_not_trusted AS SinValidar
FROM sys.check_constraints
ORDER BY Esquema,Tabla,Restriccion;
