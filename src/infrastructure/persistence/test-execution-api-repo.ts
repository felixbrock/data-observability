import axios, { AxiosRequestConfig } from 'axios';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';
import { TestExecutionResultDto } from '../../domain/test-execution-api/test-execution-result-dto';
import getRoot from '../shared/api-root-builder';

export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #path = '127.0.0.1';

  #serviceName = 'test-engine';

  #port = '5000';

  executeTest = async (
    testId: string,
    jwt: string
  ): Promise<TestExecutionResultDto> => {
    try {
      const apiRoot = await getRoot(this.#serviceName, this.#port, this.#path);

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(`${apiRoot}/tests/${testId}/execute`, config);
      const jsonResponse = response.data;
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(typeof error === 'string') return Promise.reject(error);
      if(error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };
}
