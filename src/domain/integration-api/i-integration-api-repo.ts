import { SendAlertResultDto } from './slack/send-alert-result-dto';
import { SnowflakeQueryResultDto } from './snowflake/snowlake-query-result-dto';

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
  querySnowflake(body: {query: string, targetOrganizationId?: string}, jwt: string): Promise<SnowflakeQueryResultDto>;
  sendSlackAlert(
    messageConfig: AlertMessageConfig,
    targetOrganizationId: string,
    jwt: string
  ): Promise<SendAlertResultDto>;
}
