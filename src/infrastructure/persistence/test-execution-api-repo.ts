import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from '../../config';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';
import { TestExecutionResultDto } from '../../domain/test-execution-api/test-execution-result-dto';
import getRoot from '../shared/api-root-builder';


export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #path = 'tests';

  #port = '3000';

  #prodGateway = 'wvetgwc0ua.execute-api.eu-central-1.amazonaws.com/Prod';

  executeTest = async (
    testSuiteId: string,
    targetOrganizationId: string,
    jwt: string
  ): Promise<TestExecutionResultDto> => {
    try {
      let gateway = this.#port;
      if(appConfig.express.mode === 'production') gateway = this.#prodGateway;

      const apiRoot = await getRoot(gateway, this.#path, true);

      const payload = {
        targetOrganizationId
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(`${apiRoot}/${testSuiteId}/execute`, payload, config);
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

