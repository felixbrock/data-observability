import {
  SchedulerClient,
  CreateScheduleCommand,
  CreateScheduleCommandInput,
} from '@aws-sdk/client-scheduler';
import { appConfig } from '../../config';
import {
  ExecutionType,
  parseExecutionType,
} from '../value-types/execution-type';

export const testSuiteTypes = ['test', 'custom-test', 'nominal-test'] as const;

export type TestSuiteType = typeof testSuiteTypes[number];

export const parseTestSuiteType = (testSuiteType: unknown): TestSuiteType => {
  const identifiedElement = testSuiteTypes.find(
    (element) => element === testSuiteType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

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

interface BaseTargetInputPrototype {
  executionType: ExecutionType;
}

export interface CreateCronTargetInputPrototype
  extends BaseTargetInputPrototype {
  testSuiteType: TestSuiteType;
}

export type UpdateCronTargetInputPrototype = BaseTargetInputPrototype;

// interface TargetInput extends BaseTargetInputPrototype {
//   testSuiteType: TestSuiteType;
//   testSuiteId: string;
//   targetOrgId: string;
// }

const rulePrefix = 'test-suite';

/* 
For AWS Eventbridge cron jobs to be working the lambda target needs corresponding permissions being defined:  
aws lambda add-permission --function-name "test-suite-execution-job-production-app" --action 'lambda:InvokeFunction' --principal events.amazonaws.com --statement-id "test-suite-cron-rule-wildcard-policy"
*/

// const putTarget = async (
//   client: SchedulerClient,
//   ruleName: string,
//   targetInput: TargetInput
// ): Promise<void> => {
//   const putTargetsInput: PutTargetsCommandInput = {
//     Rule: ruleName,
//     Targets: [
//       {
//         Arn: appConfig.cloud.testExecutionJobArn,
//         Id: 'test-execution-job',
//         Input: JSON.stringify({
//           ...targetInput,
//         }),
//       },
//     ],
//   };

//   const putTargetsCommand = new PutTargetsCommand(putTargetsInput);

//   const putTargetsResponse = await client.send(putTargetsCommand);

//   if (putTargetsResponse.FailedEntryCount !== 0)
//     throw new Error(
//       `Unexpected error occurred while creating cron job ( testSuiteId: ${targetInput.testSuiteId})`
//     );

//   client.destroy();
// };

export const createCronJob = async (
  cron: string,
  testSuiteId: string,
  orgId: string,
  targetInputPrototype: CreateCronTargetInputPrototype,
  client: SchedulerClient
): Promise<void> => {
  if (!targetInputPrototype.testSuiteType) throw new Error();

  const scheduleName = `${rulePrefix}-${testSuiteId}`;

  const commandInput: CreateScheduleCommandInput = {
    Name: scheduleName,
    GroupName: orgId,
    ScheduleExpression: `cron(${cron})`,
    State: 'ENABLED',
    Target: {
      Arn: appConfig.cloud.testExecutionJobArn,
      RoleArn: appConfig.cloud.roleTestExecutionJobArn,
      Input: JSON.stringify({
        testSuiteId,
        targetOrgId: orgId,
        ...targetInputPrototype,
      }),
    },
  };

  const command = new CreateScheduleCommand(commandInput);

  const res = await client.send(command);

  if (!res.RuleArn) throw new Error('Rule ARN for cron rule not returned');

  await putTarget(client, scheduleName, {
    testSuiteId,
    targetOrgId: orgId,
    ...targetInputPrototype,
  });
};

export const updateCronJobState = async (
  testSuiteId: string,
  toBeActivated: boolean,
  client: SchedulerClient
): Promise<void> => {
  const ruleName = `${rulePrefix}-${testSuiteId}`;
  const input = { Name: ruleName };

  const command = toBeActivated
    ? new EnableRuleCommand(input)
    : new DisableRuleCommand(input);

  await client.send(command);
};

// const getCurrentTargetInput = async (
//   client: SchedulerClient,
//   ruleName: string
// ): Promise<TargetInput> => {
//   const command = new ListTargetsByRuleCommand({
//     Rule: ruleName,
//   });
//   const response = await client.send(command);

//   const { Targets: targets } = response;

//   if (!targets || !targets.length) throw new Error('No targets found');

//   const targetMatch = targets.find(
//     (el) => el.Arn === appConfig.cloud.testExecutionJobArn
//   );

//   if (!targetMatch) throw new Error('Desired target not found');
//   if (!targetMatch.Input) throw new Error('Target is missing input object');

//   const input = JSON.parse(targetMatch.Input);

//   const { testSuiteType, executionType, targetOrgId, testSuiteId } = input;

//   if (!testSuiteType) throw new Error('Target input is missing testSuiteType');

//   return {
//     testSuiteType: parseTestSuiteType(testSuiteType),
//     executionType: parseExecutionType(executionType),
//     targetOrgId,
//     testSuiteId,
//   };
// };

// export const patchCronJob = async (
//   testSuiteId: string,
//   updateProps: {
//     cron?: string;
//   },
//   client:SchedulerClient
// ): Promise<void> => {
//   if (!updateProps.cron)
//     throw new Error(`No input provided for updating cron job`);

//   const ruleName = `${rulePrefix}-${testSuiteId}`;
//   const commandInput: PutRuleCommandInput = {
//     Name: ruleName,
//   };

//   if (updateProps.cron)
//     commandInput.ScheduleExpression = `cron(${updateProps.cron})`;

//   const command = new PutRuleCommand(commandInput);

//   const response = await client.send(command);

//   if (!response.RuleArn)
//     throw new Error(
//       `Unexpected error occured while updating cron job for test suite ${testSuiteId}`
//     );
// };

// export const patchTarget = async (
//   testSuiteId: string,
//   targetInputPrototype: UpdateCronTargetInputPrototype,
//   client : SchedulerClient
// ): Promise<void> => {

//   const ruleName = `${rulePrefix}-${testSuiteId}`;

//   const currentTargetInput = await getCurrentTargetInput(
//     client,
//     ruleName
//   );

//   await putTarget(client, ruleName, {
//     ...currentTargetInput,
//     ...targetInputPrototype,
//   });
// };
