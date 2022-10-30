import { NominalTestType } from '../entities/nominal-test-suite';
import {
  columnTestTypes,
  matTestTypes,
  TestType,
} from '../entities/test-suite';

export interface CustomTestSuiteUpdateDto {
  id: string;
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  name?: string;
  description?: string;
  sqlLogic?: string;
  targetResourceIds?: string[];
  cron?: string;
  executionType: string;
}

export const citoMaterializationNames = [
  'test_suites',
  'test_history',
  'test_results',
  'test_executions',
  'test_alerts',
  'test_suites_nominal',
  'test_history_nominal',
  'test_results_nominal',
  'test_executions_nominal',
  'test_alerts_nominal',
  'test_suites_custom',
] as const;
export type CitoMaterializationName = typeof citoMaterializationNames[number];

export const parseCitoMaterializationName = (
  citoMaterializationName: unknown
): CitoMaterializationName => {
  const identifiedElement = citoMaterializationNames.find(
    (element) => element === citoMaterializationName
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface ColumnDefinition {
  name: string;
  selectType?: string;
}

export default class CitoDataQuery {
  static getInsertQuery = (
    materializationAddress: string,
    columnDefinitions: ColumnDefinition[],
    values: string[]
  ): string => `
  insert into ${materializationAddress}(${columnDefinitions
    .map((el) => el.name)
    .join(', ')})
  select ${columnDefinitions
    .map((el, index) =>
      el.selectType ? `${el.selectType}($${index + 1})` : `$${index + 1}`
    )
    .join(', ')}
  from values ${values.join(', ')};
  `;

  static getReadTestSuiteQuery = (
    ids: string[],
    tableName: CitoMaterializationName
  ): string => `
    select * from cito.observability.${tableName}
    where ${ids.map((el) => `id = '${el}'`).join(' or ')};
    `;

  static getReadTestSuitesQuery = (
    tableName: CitoMaterializationName,
    namesOfFieldsToReturn: string[],
    where?: string
  ): string => `select ${
      !namesOfFieldsToReturn.length ? '*' : namesOfFieldsToReturn.join(', ')
    } from cito.observability.${tableName}
    ${where ? `where ${where}` : ''}`;

  static getUpdateQuery = (
    materializationAddress: string,
    columnDefinitions: ColumnDefinition[],
    values: string[]
  ): string => `
  merge into ${materializationAddress} target
  using (
  select ${columnDefinitions
    .map((el, index) =>
      el.selectType
        ? `${el.selectType}($${index + 1}) as ${el.name}`
        : `$${index + 1} as ${el.name}`
    )
    .join(', ')}
  from values ${values.join(', ')}) as source
  on source.id = target.id
when matched then update set ${columnDefinitions
    .map((el) => `target.${el.name} = source.${el.name}`)
    .join(', ')};
  `;

  static getUpdateTestHistoryEntryQuery = (
    alertId: string,
    testType: TestType | NominalTestType,
    userFeedbackIsAnomaly: number
  ): string => {
    const tableName: CitoMaterializationName =
      testType in columnTestTypes || testType in matTestTypes
        ? 'test_history'
        : 'test_history_nominal';

    return `
  update cito.observability.${tableName}
  set user_feedback_is_anomaly = ${userFeedbackIsAnomaly}
  where alert_id = '${alertId}';
`;
  };
}
