import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from '../../config';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';
import { QualTestExecutionResultDto } from '../../domain/test-execution-api/qual-test-execution-result-dto';
import { QuantTestExecutionResultDto } from '../../domain/test-execution-api/quant-test-execution-result-dto';

export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #baseUrl = appConfig.baseUrl.testEngine;

  executeTest = async (
    testSuiteId: string,
    testType: string,
    jwt: string,
    targetOrgId?: string
  ): Promise<QuantTestExecutionResultDto | QualTestExecutionResultDto> => {
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
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };
}
