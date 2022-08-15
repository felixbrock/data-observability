import { TestExecutionResultDto } from './test-execution-result-dto';

export interface ITestExecutionApiRepo {
  executeTest(
    testSuiteId: string,
    targetOrganizationId: string,
    jwt: string
  ): Promise<TestExecutionResultDto>;
}
