import { TestSuite } from '../entities/test-suite';

export default class CitoDataQuery {
  static getInsertTestSuiteQuery = (testSuite: TestSuite): string => `
    insert into cito.public.test_suites
    values
    ('${testSuite.id}', '${testSuite.type}', ${testSuite.activated}, ${
    testSuite.threshold
  }, ${testSuite.executionFrequency}, '${testSuite.databaseName}','${
    testSuite.schemaName
  }', '${testSuite.materializationName}', '${testSuite.materializationType}', ${
    testSuite.columnName ? `'${testSuite.columnName}'` : null
  },'${testSuite.targetResourceId}', '${testSuite.organizationId}');
    `;

  static getReadTestSuiteQuery = (id: string): string => `
    select * from cito.public.test_suites
    where id = '${id}';
    `;

  static getReadTestSuitesQuery = (
    executionFrequency?: number,
    activated?: boolean,
    organizationId?: string
  ): string => {
    const selectClause = 'select * from cito.public.test_suites';

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

  static getUpdateTestSuiteQuery = (
    id: string,
    activated?: boolean,
    threshold?: number,
    frequency?: number
  ): string => {
    if (activated === undefined && !threshold && !frequency)
      throw new Error('No update values provided');

    const columnNames = [];
    if (activated !== undefined) columnNames.push('activated');
    if (threshold) columnNames.push('threshold');
    if (frequency) columnNames.push('execution_frequency');

    const updateValues = [];
    if (activated !== undefined) updateValues.push(activated);
    if (threshold) updateValues.push(threshold);
    if (frequency) updateValues.push(frequency);

    return `
    update cito.public.test_suites
    set ${
      columnNames.length > 1 ? `(${columnNames.join(',')})` : columnNames[0]
    } = ${
      updateValues.length > 1 ? `(${updateValues.join(',')})` : updateValues[0]
    }
    where id = '${id}';
  `;
  };

  static getUpdateTestHistoryEntryQuery = (
    alertId: string,
    userFeedbackIsAnomaly: number
  ): string => `
  update cito.public.test_history
  set user_feedback_is_anomaly = ${userFeedbackIsAnomaly}
  where alert_id = '${alertId}';
`;
}
