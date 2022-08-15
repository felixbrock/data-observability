import axios, { AxiosRequestConfig } from 'axios';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';
import { TestExecutionResultDto } from '../../domain/test-execution-api/test-execution-result-dto';

export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #path = '127.0.0.1';

  #serviceName = 'test-engine';

  #port = '5000';

  executeTest = async (
    testSuiteId: string,
    targetOrganizationId: string,
    jwt: string
  ): Promise<TestExecutionResultDto> => {
    try {
      const payload = {
        targetOrganizationId
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(`http://${this.#path}:${this.#port}/tests/${testSuiteId}/execute`, payload, config);
      const jsonResponse = response.data;
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(typeof error === 'string') return Promise.reject(error);
      if(error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };
}
