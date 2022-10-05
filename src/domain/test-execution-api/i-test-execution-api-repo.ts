import { AnomalyTestExecutionResultDto } from './anomaly-test-execution-result-dto';
import { NominalTestExecutionResultDto } from './nominal-test-execution-result-dto';

export interface ITestExecutionApiRepo {
  executeTest(
    testSuiteId: string,
    testType: string,
    jwt: string,
    targetOrganizationId?: string,
  ): Promise<AnomalyTestExecutionResultDto | NominalTestExecutionResultDto>;
}
