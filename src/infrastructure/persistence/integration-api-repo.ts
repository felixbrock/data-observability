import axios, { AxiosRequestConfig } from 'axios';
import { SnowflakeQueryResultDto } from '../../domain/integration-api/snowflake/snowlake-query-result-dto';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../../domain/integration-api/i-integration-api-repo';
import getRoot from '../shared/api-root-builder';
import { SendAlertResultDto } from '../../domain/integration-api/slack/send-alert-result-dto';
import { appConfig } from '../../config';

export default class IntegrationApiRepo implements IIntegrationApiRepo {
  #path = 'api/v1';

  #port = '3002';

  #prodGateway = 'wej7xjkvug.execute-api.eu-central-1.amazonaws.com/production';

  querySnowflake = async (
    query: string,
    jwt: string
  ): Promise<SnowflakeQueryResultDto> => {
    try {
      let gateway = this.#port;
      if (appConfig.express.mode === 'production') gateway = this.#prodGateway;

      const apiRoot = await getRoot(gateway, this.#path, false);

      const data = {
        query,
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(
        `${apiRoot}/snowflake/query`,
        data,
        config
      );
      const jsonResponse = response.data;
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  sendSlackAlert = async (
    messageConfig: AlertMessageConfig,
    targetOrganizationId: string,
    jwt: string
  ): Promise<SendAlertResultDto> => {
    try {
      let gateway = this.#port;
      if (appConfig.express.mode === 'production') gateway = this.#prodGateway;

      const apiRoot = await getRoot(gateway, this.#path, false);

      const data = {
        messageConfig,
        targetOrganizationId,
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(
        `${apiRoot}/slack/alert/send`,
        data,
        config
      );
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
