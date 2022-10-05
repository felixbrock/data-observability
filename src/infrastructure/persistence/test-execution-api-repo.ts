import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from '../../config';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';
import { AnomalyTestExecutionResultDto } from '../../domain/test-execution-api/anomaly-test-execution-result-dto';
import getRoot from '../shared/api-root-builder';


export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #path = 'tests';

  #port = '3047';

  #prodGateway = 'wvetgwc0ua.execute-api.eu-central-1.amazonaws.com/Prod';

  executeTest = async (
    testSuiteId: string,
    targetOrganizationId: string,
    jwt: string
  ): Promise<AnomalyTestExecutionResultDto> => {
    try {
      let gateway = this.#port;
      if(appConfig.express.mode === 'production') gateway = this.#prodGateway;

      const apiRoot = await getRoot(gateway, this.#path, false);

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
      if(error instanceof Error && error.message) console.trace(error.message); 
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };
}

