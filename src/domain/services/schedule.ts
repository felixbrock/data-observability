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
  DeleteScheduleCommandInput,
  DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler';
import { appConfig } from '../../config';
import { ExecutionType } from '../value-types/execution-type';

interface TestSuiteScheduleObj {
  executionType: ExecutionType;
  cron: string;
  toBeActivated: boolean;
  testSuiteId: string;
}

export const testSuiteTypes = ['test', 'custom-test', 'nominal-test'] as const;

export type TestSuiteType = typeof testSuiteTypes[number];

export const parseTestSuiteType = (testSuiteType: unknown): TestSuiteType => {
  const identifiedElement = testSuiteTypes.find(
    (element) => element === testSuiteType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
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

interface TargetInputPrototype {
  executionType: ExecutionType;
  testSuiteType: TestSuiteType;
}

export interface ScheduleProps {
  cron: string;
  toBeActivated: boolean;
}

const schedulePrefix = 's';
const groupPrefix = 'g';

/* 
For AWS Eventbridge schedule s to be working the lambda target needs corresponding permissions being defined:  
aws lambda add-permission --function-name "test-suite-execution--production-app" --action 'lambda:InvokeFunction' --principal events.amazonaws.com --statement-id "test-suite-schedule-rule-wildcard-policy"
*/

const generateMessageGroupId = (numPossibleChoices = 25): string =>
  `message-group-${Math.floor(Math.random() * numPossibleChoices).toString()}`;

const getScheduleName = (testSuiteId: string): string =>
  `${schedulePrefix}-${testSuiteId}`;

const getGroupName = (orgId: string): string => `${groupPrefix}-${orgId}`;

const groupExists = async (
  orgId: string,
  client: SchedulerClient
): Promise<boolean> => {
  const commandInput: ListScheduleGroupsCommandInput = {
    NamePrefix: getGroupName(orgId),
  };

  const command = new ListScheduleGroupsCommand(commandInput);

  const res = await client.send(command);

  if (res.ScheduleGroups && res.ScheduleGroups.length > 1)
    throw new Error('Multiple schedule groups found that match name');

  return !!(res.ScheduleGroups && res.ScheduleGroups.length);
};

const createGroup = async (
  orgId: string,
  client: SchedulerClient
): Promise<void> => {
  const commandInput: CreateScheduleGroupCommandInput = {
    Name: getGroupName(orgId),
  };

  const command = new CreateScheduleGroupCommand(commandInput);

  const res = await client.send(command);

  if (!res.ScheduleGroupArn)
    throw new Error('Rule ARN for schedule rule not returned');
};

const createSchedule = async (
  scheduleProps: ScheduleProps,
  testSuiteId: string,
  orgId: string,
  targetInputPrototype: TargetInputPrototype,
  client: SchedulerClient
): Promise<void> => {
  const scheduleName = getScheduleName(testSuiteId);
  const groupName = getGroupName(orgId);

  const commandInput: CreateScheduleCommandInput = {
    Name: scheduleName,
    GroupName: groupName,
    ScheduleExpression: `cron(${scheduleProps.cron})`,
    FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
    State: scheduleProps.toBeActivated
      ? ScheduleState.ENABLED
      : ScheduleState.DISABLED,
    Target: {
      Arn: appConfig.cloud.scheduleQueueArn,
      RoleArn: appConfig.cloud.testExecutionJobRoleArn,
      Input: JSON.stringify({
        testSuiteId,
        targetOrgId: orgId,
        ...targetInputPrototype,
      }),
      SqsParameters: { MessageGroupId: generateMessageGroupId() },
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
): Promise<Schedule | undefined> => {
  const getCommandInput: GetScheduleCommandInput = {
    GroupName: getGroupName(orgId),
    Name: name,
  };

  try {
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
    if (!Arn || !RoleArn || !Input)
      throw new Error('Missing target properties');

    return {
      Name,
      GroupName,
      State,
      ScheduleExpression,
      FlexibleTimeWindow: flexibleTimeWindow,
      Target: { Arn, RoleArn, Input },
    };
  } catch (error) {
    return undefined;
  }
};

const updateSchedule = async (
  testSuiteId: string,
  orgId: string,
  scheduleProps: ScheduleProps,
  targetInputPrototype: TargetInputPrototype,
  schedule: Schedule,
  client: SchedulerClient
): Promise<void> => {
  const commandInput: UpdateScheduleCommandInput = schedule;
  commandInput.ScheduleExpression = `cron(${scheduleProps.cron})`;

  if (scheduleProps.toBeActivated) commandInput.State = ScheduleState.ENABLED;
  else if (scheduleProps.toBeActivated !== undefined)
    commandInput.State = ScheduleState.DISABLED;

  if (!commandInput.Target)
    throw new Error('Current schedule is missing target input');

  if (targetInputPrototype && targetInputPrototype.executionType) {
    commandInput.Target.Input = JSON.stringify({
      ...JSON.parse(schedule.Target.Input),
      executionType: targetInputPrototype.executionType,
    });
  }

  commandInput.Target.SqsParameters = {
    MessageGroupId: generateMessageGroupId(),
  };

  const command = new UpdateScheduleCommand(commandInput);

  const res = await client.send(command);

  if (!res.ScheduleArn)
    throw new Error(
      `Unexpected error occurred while updating schedule  for test suite ${testSuiteId}`
    );
};

const createThrottleSensitive = async (
  dtos: TestSuiteScheduleObj[],
  orgId: string,
  testSuiteType: TestSuiteType,
  delayMulitplicator: number,
  schedulerClient: SchedulerClient
): Promise<void> => {
  await new Promise((resolve) =>
    // eslint-disable-next-line no-promise-executor-return
    setTimeout(resolve, 1000 + delayMulitplicator * 1000)
  );

  console.log(`Creating ${dtos.length} schedules`);

  await Promise.all(
    dtos.map(async (el) => {
      await createSchedule(
        { cron: el.cron, toBeActivated: el.toBeActivated },
        el.testSuiteId,
        orgId,
        {
          testSuiteType,
          executionType: el.executionType,
        },
        schedulerClient
      );
    })
  );
};

const sliceJobs = <T>(jobs: T[], batchSize: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    batches.push(batch);
  }
  return batches;
};

export const createSchedules = async (
  orgId: string,
  testSuiteType: TestSuiteType,
  testSuiteDtos: TestSuiteScheduleObj[]
): Promise<void> => {
  const schedulerClient = new SchedulerClient({
    region: appConfig.cloud.region,
  });

  const scheduleGroupExists = await groupExists(orgId, schedulerClient);

  if (!scheduleGroupExists) await createGroup(orgId, schedulerClient);

  const testSuiteDtoBatches = sliceJobs(testSuiteDtos, 45);

  await Promise.all(
    testSuiteDtoBatches.map(async (el, i) => {
      await createThrottleSensitive(
        el,
        orgId,
        testSuiteType,
        i,
        schedulerClient
      );
    })
  );

  schedulerClient.destroy();
};

const deleteSchedule = async (
  testSuiteId: string,
  orgId: string,
  client: SchedulerClient
): Promise<void> => {
  const scheduleName = getScheduleName(testSuiteId);

  const commandInput: DeleteScheduleCommandInput = {
    Name: scheduleName,
    GroupName: getGroupName(orgId),
  };

  const command = new DeleteScheduleCommand(commandInput);

  try {
    const res = await client.send(command);
    if (!res.$metadata.httpStatusCode)
      throw new Error('Deletion of schedule failed');
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      console.log(`Schedule ${scheduleName} not found. Skipping deletion.`);
      return;
    }
    throw error;
  }
};

const deleteThrottleSensitive = async (
  testSuiteIds: string[],
  orgId: string,
  delayMulitplicator: number,
  schedulerClient: SchedulerClient
): Promise<void> => {
  await new Promise((resolve) =>
    // eslint-disable-next-line no-promise-executor-return
    setTimeout(resolve, 1000 + delayMulitplicator * 1000)
  );

  console.log(`Deleting ${testSuiteIds.length} schedules`);

  await Promise.all(
    testSuiteIds.map(async (el) => {
      await deleteSchedule(el, orgId, schedulerClient);
    })
  );
};

export const deleteSchedules = async (
  orgId: string,
  testSuiteIds: string[]
): Promise<void> => {
  const schedulerClient = new SchedulerClient({
    region: appConfig.cloud.region,
  });

  const batches = sliceJobs(testSuiteIds, 45);

  await Promise.all(
    batches.map(async (el, i) => {
      await deleteThrottleSensitive(el, orgId, i, schedulerClient);
    })
  );

  schedulerClient.destroy();
};

const updateThrottleSensitive = async (
  dtos: TestSuiteScheduleObj[],
  orgId: string,
  testSuiteType: TestSuiteType,
  delayMulitplicator: number,
  schedulerClient: SchedulerClient
): Promise<void> => {
  await new Promise((resolve) =>
    // eslint-disable-next-line no-promise-executor-return
    setTimeout(resolve, 1000 + delayMulitplicator * 1000)
  );

  console.log(`Updating ${dtos.length} schedules`);

  await Promise.all(
    dtos.map(async (el) => {
      const { testSuiteId } = el;

      const scheduleName = getScheduleName(testSuiteId);

      const schedule = await getCurrentSchedule(
        scheduleName,
        orgId,
        schedulerClient
      );

      const scheduleProps = { cron: el.cron, toBeActivated: el.toBeActivated };
      const targetInputProps = {
        executionType: el.executionType,
        testSuiteType,
      };

      if (!schedule)
        await createSchedule(
          scheduleProps,
          testSuiteId,
          orgId,
          targetInputProps,
          schedulerClient
        );
      else
        await updateSchedule(
          testSuiteId,
          orgId,
          scheduleProps,
          targetInputProps,
          schedule,
          schedulerClient
        );
    })
  );
};

export const updateSchedules = async (
  orgId: string,
  testSuiteType: TestSuiteType,
  updateObjects: TestSuiteScheduleObj[]
): Promise<void> => {
  const schedulerClient = new SchedulerClient({
    region: appConfig.cloud.region,
  });

  const updateObjBatches = sliceJobs(updateObjects, 45);

  await Promise.all(
    updateObjBatches.map(async (el, i) => {
      await updateThrottleSensitive(
        el,
        orgId,
        testSuiteType,
        i,
        schedulerClient
      );
    })
  );

  schedulerClient.destroy();
};
