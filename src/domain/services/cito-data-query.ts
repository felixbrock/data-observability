export interface CustomTestSuiteUpdateDto {
  id: string;
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  name?: string;
  description?: string;
  sqlLogic?: string;
  targetResourceIds?: string[];
}

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

  static getReadTestSuiteQuery = (ids: string[], isCustom: boolean): string => `
    select * from cito.public.${isCustom ? 'custom_test_suites' : 'test_suites'}
    where ${ids.map((el) => `id = '${el}'`).join(' or ')};
    `;

  static getReadTestSuitesQuery = (
    isCustom: boolean,
    executionFrequency?: number,
    activated?: boolean,
    organizationId?: string
  ): string => {
    const selectClause = `select * from cito.public.${
      isCustom ? 'custom_test_suites' : 'test_suites'
    }`;

    if (!executionFrequency && !activated && !organizationId)
      return selectClause.concat(';');

    let whereClause = 'where ';
    if (activated)
      whereClause = whereClause.concat(`activated = ${activated} `);
    if (executionFrequency)
      whereClause = whereClause.concat(
        `${
          activated ? 'and ' : ''
        } execution_frequency = ${executionFrequency} `
      );
    if (organizationId)
      whereClause = whereClause.concat(
        `${
          activated || executionFrequency ? 'and ' : ''
        } $organization_id = '${organizationId}' `
      );

    return `
    ${selectClause}
    ${whereClause};
    `;
  };

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
    userFeedbackIsAnomaly: number
  ): string => `
  update cito.public.test_history
  set user_feedback_is_anomaly = ${userFeedbackIsAnomaly}
  where alert_id = '${alertId}';
`;
}
