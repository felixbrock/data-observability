import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from '../../config';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';
import { AnomalyTestExecutionResultDto } from '../../domain/test-execution-api/anomaly-test-execution-result-dto';

export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #baseUrl = appConfig.baseUrl.testEngine;

  executeTest = async (
    testSuiteId: string,
    testType: string,
    jwt: string,
    targetOrgId?: string
  ): Promise<AnomalyTestExecutionResultDto> => {
    try {
      const payload = {
        targetOrgId,
        testType,
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(
        `${this.#baseUrl}/tests/${testSuiteId}/execute`,
        payload,
        config
      );
      const jsonResponse = response.data;
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };
}
