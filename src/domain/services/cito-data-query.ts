import { TestSuite } from '../entities/test-suite';

export default class CitoDataQuery {
  static getInsertTestSuiteQuery = (testSuite: TestSuite): string => `
    insert into cito.public.test_suites
    values
    (${testSuite.id}, ${testSuite.type}, ${testSuite.activated}, ${testSuite.threshold}, ${testSuite.executionFrequency}, ${testSuite.materializationAddress}, ${testSuite.columnName});
    `;

  static getReadTestSuiteQuery = (id: string): string => `
    select * from cito.public.test_suites
    where id = ${id};
    `;

  static getReadTestSuitesQuery = (
    executionFrequency: number,
    activated = true
  ): string => `
    select * from cito.public.test_suites
    where execution_frequency = ${executionFrequency} and activated = ${activated};
    `;

  static getUpdateTestSuiteQuery = (id: string, activated: boolean): string => `
    update cito.public.test_suites
    set activated = ${activated}
    where id = ${id};
  `;
}
