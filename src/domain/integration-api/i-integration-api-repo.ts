import { AlertDto } from "./slack/alert-dto";
import { SendAlertResultDto } from "./slack/send-alert-result-dto";
import { SnowflakeQueryResultDto } from "./snowflake/snowlake-query-result-dto";

export interface IIntegrationApiRepo {
  querySnowflake(query: string, jwt: string): Promise<SnowflakeQueryResultDto>;
  sendSlackAlert(alert: AlertDto, jwt: string): Promise<SendAlertResultDto>;
}