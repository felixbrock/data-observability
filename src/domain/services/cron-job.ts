import {
  EventBridgeClient,
  PutRuleCommand,
  PutRuleCommandInput,
  PutTargetsCommand,
  PutTargetsCommandInput,
} from '@aws-sdk/client-eventbridge';
import { appConfig } from '../../config';

export const getFrequencyCronExpression = (frequency: number): string => {
  const currentDate = new Date();
  const currentMinutes = currentDate.getUTCMinutes();
  const currentHours = currentDate.getUTCHours();

  switch (frequency) {
    case 1:
      return `${currentMinutes} * * * ? *`;

    case 3:
      return `${currentMinutes} */3 * * ? *`;

    case 6:
      return `${currentMinutes} */6 * * ? *`;

    case 12:
      return `${currentMinutes} */12 * * ? *`;

    case 24:
      return `${currentMinutes} ${currentHours} * * ? *`;

    default:
      throw new Error('Unhandled cron expression frequency input');
  }
};

export const createCronJob = async (
  testSuiteId: string,
  cron: string,
  organizationId: string
): Promise<void> => {
  const eventBridgeClient = new EventBridgeClient({
    region: appConfig.cloud.region,
  });

  const ruleName = `test-suite-${testSuiteId}`;

  const putRuleInput: PutRuleCommandInput = {
    Name: ruleName,
    Description: `org-id: ${organizationId}`,
    Tags: [
      { Key: 'test-suite-id', Value: testSuiteId },
      { Key: 'organization-id', Value: organizationId },
    ],
    ScheduleExpression: `cron(${cron})`,
    State: 'ENABLED',
  };

  const putRuleCommand = new PutRuleCommand(putRuleInput);

  const putRuleResponse = await eventBridgeClient.send(putRuleCommand);

  if (!putRuleResponse.RuleArn)
    throw new Error('Rule ARN for cron rule not returned');

  const putTargetsInput: PutTargetsCommandInput = {
    Rule: ruleName,
    Targets: [
      {
        Arn: appConfig.cloud.testExecutionJobArn,
        Id: 'test-execution-job',
        Input: JSON.stringify({
          testSuiteId,
        }),
      },
    ],
  };

  const putTargetsCommand = new PutTargetsCommand(putTargetsInput);

  const putTargetsResponse = await eventBridgeClient.send(putTargetsCommand);

  if (putTargetsResponse.FailedEntryCount === 0) return;

  throw new Error(
    `Unexpected error occurred while creating cron job (orgId: ${organizationId}, testSuiteId: ${testSuiteId})`
  );
};

export const patchCronJob = async (
  testSuiteId: string,
  updateProps: {
    cron?: string;
    toBeActivated?: boolean;
  }
): Promise<void> => {
  if (!updateProps.cron && updateProps.toBeActivated === undefined)
    throw new Error(`No input provided for updating cron job`);

  const eventBridgeClient = new EventBridgeClient({
    region: appConfig.cloud.region,
  });

  const commandInput: PutRuleCommandInput = {
    Name: `test-suite-${testSuiteId}`,
  };

  if (updateProps.cron)
    commandInput.ScheduleExpression = `cron(${updateProps.cron})`;

  if (updateProps.toBeActivated !== undefined)
    commandInput.State = updateProps.toBeActivated ? 'ENABLED' : 'DISABLED';

  const command = new PutRuleCommand(commandInput);

  const response = await eventBridgeClient.send(command);

  if (response.RuleArn) return;

  throw new Error(
    `Unexpected error occured while updating cron job for test suite ${testSuiteId}`
  );
};
