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
  }, '${testSuite.organizationId}');
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

  static getUpdateTestSuiteQuery = (id: string, activated: boolean): string => `
    update cito.public.test_suites
    set activated = ${activated}
    where id = '${id}';
  `;
}
