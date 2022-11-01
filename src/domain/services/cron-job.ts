import {
  EventBridgeClient,
  PutRuleCommand,
  PutRuleCommandInput,
  PutTargetsCommand,
  PutTargetsCommandInput,
  TagResourceCommand,
  TagResourceCommandInput,
} from '@aws-sdk/client-eventbridge';
import { appConfig } from '../../config';
import { ExecutionType } from '../value-types/execution-type';

type TestSuiteType = 'test' | 'custom-test' | 'nominal-test';

export const getAutomaticCronExpression = (): string => `*/5 * * * ? *`;

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

/* 
For AWS Eventbridge cron jobs to be working the lambda target needs corresponding permissions being defined:  
aws lambda add-permission --function-name "test-suite-execution-job-production-app" --action 'lambda:InvokeFunction' --principal events.amazonaws.com --statement-id "test-suite-cron-rule-wildcard-policy"
*/

export const createCronJob = async (
  testSuiteSpecs: {
    testSuiteId: string;
    testSuiteType: TestSuiteType;
  },
  cron: string,
  executionType: ExecutionType,
  organizationId: string
): Promise<void> => {
  const eventBridgeClient = new EventBridgeClient({
    region: appConfig.cloud.region,
  });

  const ruleName = `test-suite-${testSuiteSpecs.testSuiteId}`;

  const putRuleInput: PutRuleCommandInput = {
    Name: ruleName,
    Description: `org-id: ${organizationId}`,
    Tags: [
      { Key: 'test-suite-id', Value: testSuiteSpecs.testSuiteId },
      { Key: 'organization-id', Value: organizationId },
      { Key: 'execution-type', Value: executionType },
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
          ...testSuiteSpecs,
        }),
      },
    ],
  };

  const putTargetsCommand = new PutTargetsCommand(putTargetsInput);

  const putTargetsResponse = await eventBridgeClient.send(putTargetsCommand);

  if (putTargetsResponse.FailedEntryCount === 0) return;

  throw new Error(
    `Unexpected error occurred while creating cron job (orgId: ${organizationId}, testSuiteId: ${testSuiteSpecs.testSuiteId})`
  );
};

const tagRule = async (
  client: EventBridgeClient,
  arn: string,
  tags: { Key: string; Value: string }[]
): Promise<void> => {
  const input: TagResourceCommandInput = {
    ResourceARN: arn,
    Tags: tags,
  };

  const tagResourceCommand = new TagResourceCommand(input);
  await client.send(tagResourceCommand);
};

export const patchCronJob = async (
  testSuiteId: string,
  updateProps: {
    cron?: string;
    toBeActivated?: boolean;
    executionType?: ExecutionType;
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

  if (!response.RuleArn)
    throw new Error(
      `Unexpected error occured while updating cron job for test suite ${testSuiteId}`
    );

  if (!updateProps.executionType) return;

  await tagRule(eventBridgeClient, response.RuleArn, [
    { Key: 'execution-type', Value: updateProps.executionType },
  ]);
};
