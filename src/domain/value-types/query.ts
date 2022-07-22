export default class Query {
  
  static rowCount = (
    databaseName: string,
    tableSchemaName: string,
    tableName: string
  ): string => `select row_count 
    from ${databaseName}.information_schema.tables
    where table_schema = '${tableSchemaName.toUpperCase()}' 
    and table_name = '${tableName.toUpperCase()}'
    limit 1`;
}
