import { SendAlertResultDto } from './slack/send-alert-result-dto';

export interface SnowflakeProfileDto {
  id: string;
  accountId: string;
  username: string;
  password: string;
  organizationId: string;
  warehouseName: string;
}

export interface QualAlertMsgConfig {
  anomalyMessagePart: string;
  occurredOn: string;
  alertId: string;
  testType: string;
  summaryPart: string;
  detectedValuePart: string;
}

export interface QuantAlertMsgConfig {
  anomalyMessagePart: string;
  occurredOn: string;
  alertId: string;
  testType: string;
  summaryPart: string;
  expectedRangePart: string;
  detectedValuePart: string;
  importance: string;
  testSuiteId: string;
  imageUrl: string;
}
export interface IIntegrationApiRepo {
  sendQualSlackAlert(
    messageConfig: QualAlertMsgConfig,
    targetOrgId: string,
    jwt: string
  ): Promise<SendAlertResultDto>;
  sendQuantSlackAlert(
    messageConfig: QuantAlertMsgConfig,
    targetOrgId: string,
    jwt: string
  ): Promise<SendAlertResultDto>;
  getSnowflakeProfile(
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto>;
}
