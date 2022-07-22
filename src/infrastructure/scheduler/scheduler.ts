import { CronJob, CronJobParameters } from 'cron';
import { Frequency } from '../../domain/value-types/job';
import { ValidateData } from '../../domain/data-validation-api/validate-data';
import { ReadTestSuites } from '../../domain/test-suite/read-test-suites';
import Dbo from '../persistence/db/mongo-db';
import { CreateTestExecution } from '../../domain/test/create-test-result';
import { SlackMessage } from '../../domain/slack-api/slack-message-dto';
import { TestSuite } from '../../domain/entities/test-suite';
import { DataValidationResult } from '../../domain/value-types/test-execution';

const createAlertMessage = async (
  testSuite: TestSuite,
  dataValidationResult: DataValidationResult
): Promise<SlackMessage> => {
  const columnName = testSuite.statisticalModel.expectation.configuration.column;
  const tableName = 'todo';
  const executionTime = dataValidationResult.meta.run_id.run_time;
  const { type } = testSuite;

  const deviation = -999999999999;
  const testedValueCount =
    dataValidationResult.results[0].result.element_count;
  const unexpectedValues =
    dataValidationResult.results[0].result.partial_unexpected_list;

  return {
    columnName: typeof columnName === 'string' ? columnName : 'todo',
    tableName,
    executionTime: typeof executionTime === 'string' ? executionTime : 'todo',
    testType: type,
    deviation,
    testedValueCount,
    unexpectedValues,
  };
};

export default class Scheduler {
  readonly #readTestSuites: ReadTestSuites;

  readonly #validateData: ValidateData;

  readonly #createTestExecution: CreateTestExecution;

  readonly #dbo: Dbo;

  #onTick = async (frequency: Frequency): Promise<void> => {
    console.log('Running job');

    const readTestSuitesResult = await this.#readTestSuites.execute(
      { job: { frequency }, activated: true },
      {},
      this.#dbo.dbConnection
    );

    if (!readTestSuitesResult.success)
      throw new Error(readTestSuitesResult.error);
    if (!readTestSuitesResult.value) throw new Error('Reading jobs failed');
    if (!readTestSuitesResult.value.length) return;

    const testData = { b: [1, 2, 3, 104, 3, 3, 3] };
    const testSuites = readTestSuitesResult.value;

    await Promise.all(
      testSuites.map(async (testSuite) => {
        const validateDataResult = await this.#validateData.execute({
          data: testData,
          expectationType: testSuite.statisticalModel.expectation.type,
          expectationConfiguration: testSuite.statisticalModel.expectation.configuration,
        });

        if (!validateDataResult.success)
          throw new Error(readTestSuitesResult.error);
        if (!validateDataResult.value) throw new Error('Reading jobs failed');

        const dataValidationResult = validateDataResult.value;

        const createTestExecutionResult =
          await this.#createTestExecution.execute(
            {
              testSuiteId: testSuite.id,
              dataValidationResult,
            },
            { organizationId: 'todo' },
            this.#dbo.dbConnection
          );

        if (!createTestExecutionResult.success)
          throw new Error(createTestExecutionResult.error);
        if (!createTestExecutionResult.value)
          throw new Error('Creating data validation result failed');

        const alertMessage = createAlertMessage(
          testSuite,
          validateDataResult.value
        );

        console.log(alertMessage);
      })
    );

    console.log('--------results----------');
  };

  #cronJobOption: { [key: string]: CronJobParameters } = {
    oneSecondCronJobOption: {
      cronTime: '* * * * * *',
      onTick: () => {
        this.#onTick('1h');
      },
    },
    oneHourCronJobOption: {
      cronTime: '0 * * * *',
      onTick: () => {
        this.#onTick('1h');
      },
    },
    threeHourCronJobOption: {
      cronTime: '0 */3 * * *',
      onTick: () => {
        this.#onTick('3h');
      },
    },
    sixHourCronJobOption: {
      cronTime: '0 */6 * * *',
      onTick: () => {
        this.#onTick('6h');
      },
    },
    twelveHourCronJobOption: {
      cronTime: '0 */12 * * *',
      onTick: () => {
        this.#onTick('12h');
      },
    },

    oneDayCronJobOption: {
      cronTime: '0 * */1 * *',
      onTick: () => {
        this.#onTick('1d');
      },
    },
  };

  #jobs: CronJob[] = [
    new CronJob(this.#cronJobOption.oneSecondCronJobOption),
    new CronJob(this.#cronJobOption.oneHourCronJobOption),
    new CronJob(this.#cronJobOption.threeHourCronJobOption),
    new CronJob(this.#cronJobOption.sixHourCronJobOption),
    new CronJob(this.#cronJobOption.twelveHourCronJobOption),
    new CronJob(this.#cronJobOption.oneDayCronJobOption),
  ];

  constructor(
    readTestSuites: ReadTestSuites,
    validateData: ValidateData,
    createTestExecution: CreateTestExecution,
    dbo: Dbo
  ) {
    this.#readTestSuites = readTestSuites;
    this.#validateData = validateData;
    this.#createTestExecution = createTestExecution;
    this.#dbo = dbo;
  }

  run = async (): Promise<void> => {
    try {
      this.#jobs.forEach((job) => job.start());

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');
    } catch (error: unknown) {
      if (typeof error === 'string') console.log(error);
      if (error instanceof Error) console.log(error.message);
      console.log('Unknown error occured');
    }
  };
}
