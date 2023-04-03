import axios, { AxiosRequestConfig } from 'axios';
import {
  IIntegrationApiRepo,
  QualAlertMsgConfig,
  QuantAlertMsgConfig,
  SnowflakeProfileDto,
} from '../../domain/integration-api/i-integration-api-repo';
import { SendAlertResultDto } from '../../domain/integration-api/slack/send-alert-result-dto';
import { appConfig } from '../../config';

export default class IntegrationApiRepo implements IIntegrationApiRepo {
  #version = 'v1';

  #baseUrl = appConfig.baseUrl.integrationService;

  #apiRoot = appConfig.express.apiRoot;

  sendQuantSlackAlert = async (
    messageConfig: QuantAlertMsgConfig,
    targetOrgId: string,
    jwt: string
  ): Promise<SendAlertResultDto> => {
    try {
      console.log(messageConfig);
      console.log(targetOrgId);
      console.log(jwt);

      // const data = {
      //   messageConfig,
      //   targetOrgId,
      // };

      // const config: AxiosRequestConfig = {
      //   headers: { Authorization: `Bearer ${jwt}` },
      // };

      // const response = await axios.post(
      //   `${this.#baseUrl}/${this.#apiRoot}/${this.#version}/slack/alert/quant`,
      //   data,
      //   config
      // );
      const response: {
        data: { message: string; success: boolean };
        status: number;
      } = {
        data: { message: 'test', success: true },
        status: 201,
      };
      const jsonResponse = response.data;
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  sendQualSlackAlert = async (
    messageConfig: QualAlertMsgConfig,
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
        `${this.#baseUrl}/${this.#apiRoot}/${this.#version}/slack/alert/qual`,
        data,
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

  getSnowflakeProfile = async (
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto> => {
    try {
      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
        params: targetOrgId ? new URLSearchParams({ targetOrgId }) : undefined,
      };

      const response = await axios.get(
        `${appConfig.baseUrl.integrationService}/api/v1/snowflake/profile`,
        config
      );
      const jsonResponse = response.data;
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error());
    }
  };
}
