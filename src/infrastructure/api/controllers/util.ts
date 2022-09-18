import {
  EventBridgeClient,
  PutRuleCommand,
  PutRuleCommandInput,
} from '@aws-sdk/client-eventbridge';

// eslint-disable-next-line import/prefer-default-export
export const putCronJob = async (
  id: string,
  cron?: string,
  toBeActivated?: boolean
): Promise<string> => {
  if (!cron && toBeActivated === undefined)
    return `message: Cron job is up to date`;

  const REGION = 'eu-central-1';
  const eventBridgeClient = new EventBridgeClient({ region: REGION });

  const commandInput: PutRuleCommandInput = {
    Name: `test-suite-${id}`,
  };

  if (cron) commandInput.ScheduleExpression = `cron(${cron})`;

  if (toBeActivated !== undefined)
    commandInput.State = toBeActivated ? 'ENABLED' : 'DISABLED';

  const command = new PutRuleCommand(commandInput);

  const response = await eventBridgeClient.send(command);

  if (response.RuleArn) return `message: Rule ARN - ${response.RuleArn}`;
  throw new Error(
    `Unexpected http status (${response.$metadata.httpStatusCode}) code when creating cron job: ${response}`
  );
};
