import {
  SchedulerClient,
  CreateScheduleCommand,
  CreateScheduleCommandInput,
  UpdateScheduleCommandInput,
  UpdateScheduleCommand,
  GetScheduleCommandInput,
  GetScheduleCommand,
  FlexibleTimeWindow,
  ScheduleState,
  FlexibleTimeWindowMode,
  CreateScheduleGroupCommandInput,
  CreateScheduleGroupCommand,
  ListScheduleGroupsCommand,
  ListScheduleGroupsCommandInput,
} from '@aws-sdk/client-scheduler';
import { appConfig } from '../../config';
import { ExecutionType } from '../value-types/execution-type';

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
      throw new Error('Unhandled schedule expression frequency input');
  }
};

interface Schedule {
  Name: string;
  GroupName: string;
  ScheduleExpression: string;
  FlexibleTimeWindow: FlexibleTimeWindow | undefined;
  State: ScheduleState;
  Target: {
    Arn: string;
    RoleArn: string;
    Input: string;
  };
}

interface BaseTargetInputPrototype {
  executionType: ExecutionType;
}

export interface CreateScheduleTargetInputPrototype
  extends BaseTargetInputPrototype {
  testSuiteType: TestSuiteType;
}

export type UpdateScheduleTargetInputPrototype = BaseTargetInputPrototype;

const rulePrefix = 'test-suite';

/* 
For AWS Eventbridge schedule s to be working the lambda target needs corresponding permissions being defined:  
aws lambda add-permission --function-name "test-suite-execution--production-app" --action 'lambda:InvokeFunction' --principal events.amazonaws.com --statement-id "test-suite-schedule-rule-wildcard-policy"
*/

export const groupExists = async (
  orgId: string,
  client: SchedulerClient
): Promise<boolean> => {
  const commandInput: ListScheduleGroupsCommandInput = {
    NamePrefix: orgId,
  };

  const command = new ListScheduleGroupsCommand(commandInput);

  const res = await client.send(command);

  if(res.ScheduleGroups && res.ScheduleGroups.length > 1) throw new Error('Multiple schedule groups found that match name');

  return !!(res.ScheduleGroups && res.ScheduleGroups.length);
};

const createScheduleGroup = async (
  orgId: string,
  client: SchedulerClient
): Promise<void> => {
  const commandInput: CreateScheduleGroupCommandInput = {
    Name: orgId,
  };

  const command = new CreateScheduleGroupCommand(commandInput);

  const res = await client.send(command);

  if (!res.ScheduleGroupArn)
    throw new Error('Rule ARN for schedule rule not returned');
};

export const createSchedule = async (
  cron: string,
  testSuiteId: string,
  orgId: string,
  targetInputPrototype: CreateScheduleTargetInputPrototype,
  scheduleGroupExists: boolean,
  client: SchedulerClient
): Promise<void> => {
  if (!scheduleGroupExists) await createScheduleGroup(orgId, client);

  const scheduleName = `${rulePrefix}-${testSuiteId}`;

  const commandInput: CreateScheduleCommandInput = {
    Name: scheduleName,
    GroupName: orgId,
    ScheduleExpression: `cron(${cron})`,
    FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
    State: ScheduleState.ENABLED,
    Target: {
      Arn: appConfig.cloud.testExecutionJobArn,
      RoleArn: appConfig.cloud.testExecutionJobRoleArn,
      Input: JSON.stringify({
        testSuiteId,
        targetOrgId: orgId,
        ...targetInputPrototype,
      }),
    },
  };

  const command = new CreateScheduleCommand(commandInput);

  const res = await client.send(command);

  if (!res.ScheduleArn)
    throw new Error('Rule ARN for schedule rule not returned');
};

const getCurrentSchedule = async (
  name: string,
  orgId: string,
  client: SchedulerClient
): Promise<Schedule> => {
  const getCommandInput: GetScheduleCommandInput = {
    GroupName: orgId,
    Name: name,
  };

  const getCommand = new GetScheduleCommand(getCommandInput);

  const schedule = await client.send(getCommand);

  const {
    Name,
    GroupName,
    State,
    ScheduleExpression,
    FlexibleTimeWindow: flexibleTimeWindow,
    Target,
  } = schedule;

  const isScheduleState = (state: unknown): state is ScheduleState =>
    typeof state === 'string' && state in ScheduleState;

  if (
    !Name ||
    !GroupName ||
    !State ||
    !isScheduleState(State) ||
    !ScheduleExpression ||
    !flexibleTimeWindow ||
    !Target
  )
    throw new Error('Unable to retrieve schedule schedule');

  const { Arn, RoleArn, Input } = Target;
  if (!Arn || !RoleArn || !Input) throw new Error('Missing target properties');

  return {
    Name,
    GroupName,
    State,
    ScheduleExpression,
    FlexibleTimeWindow: flexibleTimeWindow,
    Target: { Arn, RoleArn, Input },
  };
};

export interface ScheduleUpdateProps {
  cron?: string;
  toBeActivated?: boolean;
  target?: {
    executionType: ExecutionType;
  };
}

export const updateSchedule = async (
  testSuiteId: string,
  orgId: string,
  updateProps: ScheduleUpdateProps,
  client: SchedulerClient
): Promise<void> => {
  if (!Object.keys(updateProps).length)
    throw new Error(`No input provided for updating schedule `);

  const name = `${rulePrefix}-${testSuiteId}`;
  const schedule = await getCurrentSchedule(name, orgId, client);

  const commandInput: UpdateScheduleCommandInput = schedule;
  if (updateProps.cron) schedule.ScheduleExpression = `cron(${updateProps.cron})`;

  if (updateProps.toBeActivated) schedule.State = ScheduleState.ENABLED;
  else if (updateProps.toBeActivated !== undefined)
    schedule.State = ScheduleState.DISABLED;

  const command = new UpdateScheduleCommand(commandInput);

  const res = await client.send(command);

  if (!res.ScheduleArn)
    throw new Error(
      `Unexpected error occured while updating schedule  for test suite ${testSuiteId}`
    );
};
