import axios, { AxiosRequestConfig } from 'axios';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
  SnowflakeProfileDto,
} from '../../domain/integration-api/i-integration-api-repo';
import { SendAlertResultDto } from '../../domain/integration-api/slack/send-alert-result-dto';
import { appConfig } from '../../config';

export default class IntegrationApiRepo implements IIntegrationApiRepo {
  #version = 'v1';

  #baseUrl = appConfig.baseUrl.integrationService;

  #apiRoot = appConfig.express.apiRoot;

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
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  getSnowflakeProfile = async (
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto> => {
    try {

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
        params: targetOrgId ? new URLSearchParams({targetOrgId}): undefined
      };

      const response = await axios.get(
        `${appConfig.baseUrl.integrationService}/api/v1/snowflake/profile`,
        config
      );
      const jsonResponse = response.data;
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };
}
