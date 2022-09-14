import { CustomTestSuite } from '../entities/custom-test-suite';
import { TestSuite } from '../entities/test-suite';

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

export default class CitoDataQuery {
  static getInsertTestSuiteQuery = (testSuite: TestSuite): string => `
    insert into cito.public.test_suites
    values
    ('${testSuite.id}', '${testSuite.type}', ${testSuite.activated}, ${
    testSuite.threshold
  }, ${testSuite.executionFrequency}, '${testSuite.target.databaseName}','${
    testSuite.target.schemaName
  }', '${testSuite.target.materializationName}', '${
    testSuite.target.materializationType
  }', ${
    testSuite.target.columnName ? `'${testSuite.target.columnName}'` : null
  },'${testSuite.target.targetResourceId}', '${testSuite.organizationId}');
    `;

  static getReadTestSuiteQuery = (id: string, isCustom: boolean): string => `
    select * from cito.public.${isCustom ? 'custom_test_suites' : 'test_suites'}
    where id = '${id}';
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

  static getUpdateTestSuiteQuery = (
    id: string,
    activated?: boolean,
    threshold?: number,
    frequency?: number,
    cron?: string,
  ): string => {
    if (activated === undefined && threshold === undefined && !frequency && !cron)
      throw new Error('No update values provided');

    const columnNames = [];
    if (activated !== undefined) columnNames.push('activated');
    if (threshold) columnNames.push('threshold');
    if (frequency) columnNames.push('execution_frequency');
    if (cron) columnNames.push('cron');

    const updateValues = [];
    if (activated !== undefined) updateValues.push(activated);
    if (threshold) updateValues.push(threshold);
    if (frequency) updateValues.push(frequency);
    if (cron) updateValues.push(`\'${cron}\'`);

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

  static getInsertCustomTestSuiteQuery = (
    customTestSuite: CustomTestSuite
  ): string => `
insert into cito.public.custom_test_suites (id, activated, threshold, execution_frequency, name, description, sql_logic, target_resource_ids, organization_id)
select '${customTestSuite.id}', ${customTestSuite.activated}, ${
    customTestSuite.threshold
  }, ${customTestSuite.executionFrequency}, '${customTestSuite.name}', '${
    customTestSuite.description
  }', '${
    customTestSuite.sqlLogic
  }', array_construct(${customTestSuite.targetResourceIds
    .map((el) => `'${el}'`)
    .join(',')}), '${customTestSuite.organizationId}';
  `;

  static getUpdateCustomTestSuiteQuery = (
    updateDto: CustomTestSuiteUpdateDto
  ): string => {
    if (
      updateDto.activated === undefined &&
      updateDto.threshold === undefined &&
      !updateDto.frequency &&
      !updateDto.name &&
      !updateDto.description &&
      !updateDto.sqlLogic &&
      !updateDto.targetResourceIds
    )
      throw new Error('No update values provided');

    const columnNames = [];
    if (updateDto.activated !== undefined) columnNames.push('activated');
    if (updateDto.threshold) columnNames.push('threshold');
    if (updateDto.frequency) columnNames.push('execution_frequency');
    if (updateDto.name) columnNames.push('name');
    if (updateDto.description) columnNames.push('description');
    if (updateDto.sqlLogic) columnNames.push('sql_logic');
    if (updateDto.targetResourceIds) columnNames.push('target_resource_ids');

    const updateValues = [];
    if (updateDto.activated !== undefined)
      updateValues.push(updateDto.activated);
    if (updateDto.threshold) updateValues.push(updateDto.threshold);
    if (updateDto.frequency) updateValues.push(updateDto.frequency);
    if (updateDto.name) columnNames.push(updateDto.name);
    if (updateDto.description) columnNames.push(updateDto.description);
    if (updateDto.sqlLogic) columnNames.push(updateDto.sqlLogic);
    if (updateDto.targetResourceIds)
      columnNames.push(updateDto.targetResourceIds);

    return `
    update cito.public.custom_test_suites
    set ${
      columnNames.length > 1 ? `(${columnNames.join(',')})` : columnNames[0]
    } = ${
      updateValues.length > 1 ? `(${updateValues.join(',')})` : updateValues[0]
    }
    where id = '${updateDto.id}';
  `;
  };
}
