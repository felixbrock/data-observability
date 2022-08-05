import axios, { AxiosRequestConfig } from 'axios';
import { SnowflakeQueryResultDto } from '../../domain/integration-api/snowflake/snowlake-query-result-dto';
import { IIntegrationApiRepo } from '../../domain/integration-api/i-integration-api-repo';
import getRoot from '../shared/api-root-builder';
import { AlertDto } from '../../domain/integration-api/slack/alert-dto';
import { SendAlertResultDto } from '../../domain/integration-api/slack/send-alert-result-dto';

export default class IntegrationApiRepo implements IIntegrationApiRepo {
  #path = 'api/v1';

  #serviceName = 'integration';

  #port = '3002';

  querySnowflake = async (
    query: string,
    jwt: string
  ): Promise<SnowflakeQueryResultDto> => {
    try {     
      const apiRoot = await getRoot(this.#serviceName, this.#port, this.#path);

      const data = {
        query
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(`${apiRoot}/snowflake/query`, data, config);
      const jsonResponse = response.data;
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(typeof error === 'string') return Promise.reject(error);
      if(error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  sendSlackAlert = async (
    alert: AlertDto,
    jwt: string
  ): Promise<SendAlertResultDto> => {
    try {
      const apiRoot = await getRoot(this.#serviceName, this.#port, this.#path);

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(`${apiRoot}/slack/alert/send`, alert, config);
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
