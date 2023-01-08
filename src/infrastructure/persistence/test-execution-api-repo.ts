import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from '../../config';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';

export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #baseUrl = appConfig.baseUrl.testEngine;

  executeTest = async (
    testSuiteId: string,
    testType: string,
    jwt: string,
    targetOrgId?: string
  ): Promise<void> => {
    try {
      const payload = {
        targetOrgId,
        testType,
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      axios.post(
        `${this.#baseUrl}/tests/${testSuiteId}/execute`,
        payload,
        config
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
    }
  };
}
