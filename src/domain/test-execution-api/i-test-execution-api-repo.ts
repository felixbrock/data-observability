import { TestExecutionResultDto } from "./test-execution-result-dto";

export interface ITestExecutionApiRepo {
  executeTest(testId: string, jwt: string): Promise<TestExecutionResultDto>;
}