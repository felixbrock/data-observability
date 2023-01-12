import { QualTestExecutionResultDto } from './qual-test-execution-result-dto';
import { QuantTestExecutionResultDto } from './quant-test-execution-result-dto';

export interface ITestExecutionApiRepo {
  executeTest(
    testSuiteId: string,
    testType: string,
    jwt: string,
    targetOrgId?: string
  ): Promise<QualTestExecutionResultDto | QuantTestExecutionResultDto>;
}
