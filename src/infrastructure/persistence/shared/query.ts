import { appConfig } from "../../../config";

type SelectType = 'parse_json';

export interface ColumnDefinition {
  name: string;
  selectType?: SelectType;
  nullable: boolean;
}

export const relationPath = `${appConfig.snowflake.databaseName}.${appConfig.snowflake.schemaName}`;

export const getInsertQueryText = (
  matName: string,
  columnDefinitions: ColumnDefinition[],
  rows: unknown[]
): string => `
      insert into ${relationPath}.${matName}(${columnDefinitions
  .map((el) => el.name)
  .join(', ')})
      select ${columnDefinitions
        .map((el, index) => {
          const value = el.selectType
            ? `${el.selectType}($${index + 1})`
            : `$${index + 1}`;
          return el.nullable ? `nullif(${value}, 'null')` : value;
        })
        .join(', ')}
      from values ${rows.join(', ')};
      `;

export const getUpdateQueryText = (
  matName: string,
  colNames: ColumnDefinition[],
  rows: string[]
): string => `
        merge into ${relationPath}.${matName} target
        using (
        select ${colNames
          .map((el, index) => {
            const value = el.selectType
              ? `${el.selectType}($${index + 1})`
              : `$${index + 1}`;
            return el.nullable ? `nullif(${value}, 'null') as ${el.name}` : `${value} as ${el.name}`;
          })
          .join(', ')}
        from values ${rows.join(', ')}) as source
        on source.id = target.id
      when matched then update set ${colNames
        .map((el) => `target.${el.name} = source.${el.name}`)
        .join(', ')};
        `;
