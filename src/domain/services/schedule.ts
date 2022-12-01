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

const schedulePrefix = 's';
const groupPrefix = 'g';

/* 
For AWS Eventbridge schedule s to be working the lambda target needs corresponding permissions being defined:  
aws lambda add-permission --function-name "test-suite-execution--production-app" --action 'lambda:InvokeFunction' --principal events.amazonaws.com --statement-id "test-suite-schedule-rule-wildcard-policy"
*/

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

const createScheduleGroup = async (
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
  cron: string,
  testSuiteId: string,
  orgId: string,
  targetInputPrototype: CreateScheduleTargetInputPrototype,
  client: SchedulerClient
): Promise<void> => {
  const scheduleName = getScheduleName(testSuiteId);
  const groupName = getGroupName(orgId);

  const commandInput: CreateScheduleCommandInput = {
    Name: scheduleName,
    GroupName: groupName,
    ScheduleExpression: `cron(${cron})`,
    FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
    State: ScheduleState.ENABLED,
    Target: {
      Arn: appConfig.cloud.scheduleQueueArn,
      RoleArn: appConfig.cloud.testExecutionJobRoleArn,
      Input: JSON.stringify({
        testSuiteId,
        targetOrgId: orgId,
        ...targetInputPrototype,
      }),
      SqsParameters: { MessageGroupId: orgId },
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
    GroupName: getGroupName(orgId),
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

const updateSchedule = async (
  testSuiteId: string,
  orgId: string,
  updateProps: ScheduleUpdateProps,
  client: SchedulerClient
): Promise<void> => {
  if (!Object.keys(updateProps).length)
    throw new Error(`No input provided for updating schedule `);

  const scheduleName = getScheduleName(testSuiteId);
  const schedule = await getCurrentSchedule(scheduleName, orgId, client);

  const commandInput: UpdateScheduleCommandInput = schedule;
  if (updateProps.cron)
    commandInput.ScheduleExpression = `cron(${updateProps.cron})`;

  if (updateProps.toBeActivated) commandInput.State = ScheduleState.ENABLED;
  else if (updateProps.toBeActivated !== undefined)
    commandInput.State = ScheduleState.DISABLED;
    if (!commandInput.Target)
      throw new Error('Current schedule is missing target input');

  if (updateProps.target && updateProps.target.executionType) {
    commandInput.Target.Input = JSON.stringify({
      ...JSON.parse(schedule.Target.Input),
      executionType: updateProps.target.executionType,
    });
  }

  commandInput.Target.SqsParameters = { MessageGroupId: orgId };

  const command = new UpdateScheduleCommand(commandInput);

  const res = await client.send(command);

  if (!res.ScheduleArn)
    throw new Error(
      `Unexpected error occured while updating schedule  for test suite ${testSuiteId}`
    );
};

export const handleScheduleCreation = async <
  Dto extends {
    executionType: ExecutionType;
    executionFrequency: number;
    cron?: string;
    id: string;
  }
>(
  orgId: string,
  testSuiteType: TestSuiteType,
  testSuiteDtos: Dto[]
): Promise<void> => {
  const schedulerClient = new SchedulerClient({
    region: appConfig.cloud.region,
  });

  const scheduleGroupExists = await groupExists(orgId, schedulerClient);

  if (!scheduleGroupExists) await createScheduleGroup(orgId, schedulerClient);

  await Promise.all(
    testSuiteDtos.map(async (el) => {
      let cron: string;
      switch (el.executionType) {
        case 'automatic':
          cron = getAutomaticCronExpression();
          break;
        case 'frequency':
          cron = getFrequencyCronExpression(el.executionFrequency);
          break;
        case 'individual':
          if (!el.cron)
            throw new Error(
              `Created test suite ${el.id} misses cron value while holding execution type "individual"`
            );
          cron = el.cron;
          break;
        default:
          throw new Error('Unhandled execution type');
      }

      await createSchedule(
        cron,
        el.id,
        orgId,
        {
          testSuiteType,
          executionType: el.executionType,
        },
        schedulerClient
      );
    })
  );

  schedulerClient.destroy();
};

export const handleScheduleUpdate = async <
  UpdateObject extends {
    id: string;
    props: {
      executionType?: ExecutionType;
      cron?: string;
      frequency?: number;
      activated?: boolean;
    };
  }
>(
  orgId: string,
  updateObjects: UpdateObject[]
): Promise<void> => {
  const schedulerClient = new SchedulerClient({
    region: appConfig.cloud.region,
  });

  await Promise.all(
    updateObjects.map(async (el) => {
      const { id } = el;
      const { cron, frequency, executionType, activated } = el.props;

      const updateProps: ScheduleUpdateProps = {};

      if (executionType === 'automatic')
        updateProps.cron = getAutomaticCronExpression();
      else if (cron) updateProps.cron = cron;
      else if (frequency)
        updateProps.cron = getFrequencyCronExpression(frequency);

      if (activated !== undefined) updateProps.toBeActivated = activated;
      if (executionType)
        updateProps.target = updateProps.target
          ? {
              ...updateProps.target,
              executionType,
            }
          : { executionType };

      if (!Object.keys(updateProps).length) return;

      await updateSchedule(id, orgId, updateProps, schedulerClient);
    })
  );

  schedulerClient.destroy();
};
