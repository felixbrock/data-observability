import { AnomalyTestExecutionResultDto } from './anomaly-test-execution-result-dto';
import { NominalTestExecutionResultDto } from './nominal-test-execution-result-dto';

export interface ITestExecutionApiRepo {
  executeTest(
    testSuiteId: string,
    targetOrganizationId: string,
    jwt: string
  ): Promise<AnomalyTestExecutionResultDto | NominalTestExecutionResultDto>;
}
