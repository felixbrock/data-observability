import axios, { AxiosRequestConfig } from 'axios';
import { SnowflakeQueryResultDto } from '../../domain/integration-api/snowflake/snowlake-query-result-dto';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../../domain/integration-api/i-integration-api-repo';
import { SendAlertResultDto } from '../../domain/integration-api/slack/send-alert-result-dto';
import { appConfig } from '../../config';

export default class IntegrationApiRepo implements IIntegrationApiRepo {
  #version = 'v1';

  #baseUrl = appConfig.baseUrl.integrationService;

  #apiRoot = appConfig.express.apiRoot;

  querySnowflake = async (
    body: {query: string, targetOrgId?: string},
    jwt: string
  ): Promise<SnowflakeQueryResultDto> => {
    try {

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(
        `${this.#baseUrl}/${this.#apiRoot}/${this.#version}/snowflake/query`,
        body,
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

  sendSlackAlert = async (
    messageConfig: AlertMessageConfig,
    targetOrgId: string,
    jwt: string
  ): Promise<SendAlertResultDto> => {
    try {
      const data = {
        messageConfig,
        targetOrgId,
      };

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(
        `${this.#baseUrl}/${this.#apiRoot}/${this.#version}/slack/alert/send`,
        data,
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
