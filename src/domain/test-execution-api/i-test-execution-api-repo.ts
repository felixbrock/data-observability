
export interface ITestExecutionApiRepo {
  executeTest(
    testSuiteId: string,
    testType: string,
    jwt: string,
    targetOrgId?: string,
  ): void;
}
