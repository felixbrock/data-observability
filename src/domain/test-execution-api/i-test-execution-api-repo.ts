import { AnomalyTestExecutionResultDto } from './anomaly-test-execution-result-dto';
import { SchemaChangeTestExecutionResultDto } from './schema-change-test-execution-result-dto';

export interface ITestExecutionApiRepo {
  executeTest(
    testSuiteId: string,
    targetOrganizationId: string,
    jwt: string
  ): Promise<AnomalyTestExecutionResultDto | SchemaChangeTestExecutionResultDto>;
}
