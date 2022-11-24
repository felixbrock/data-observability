import { SendAlertResultDto } from './slack/send-alert-result-dto';

export interface SnowflakeProfileDto {
  id: string;
  accountId: string;
  username: string;
  password: string;
  organizationId: string;
  warehouseName: string;
}

export interface AlertMessageConfig {
  anomalyMessagePart: string;
  occuredOn: string;
  alertId: string;
  testType: string;
  summaryPart: string;
  expectedRangePart: string;
  detectedValuePart: string;
}
export interface IIntegrationApiRepo {
  sendSlackAlert(
    messageConfig: AlertMessageConfig,
    targetOrgId: string,
    jwt: string
  ): Promise<SendAlertResultDto>;
  getSnowflakeProfile(
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto>;
}
