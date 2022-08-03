import { CronJob, CronJobParameters } from 'cron';
import { Auth } from '@aws-amplify/auth';
import { ReadTestSuites } from '../../domain/test-suite/read-test-suites';
import Dbo from '../persistence/db/mongo-db';
import { authEnvConfig, authPassword, authUsername } from '../../config';
import { ExecuteTest } from '../../domain/test-execution-api/execute-test';

Auth.configure({
  Auth: {
    region: 'eu-central-1',
    mandatorySignIn: true,
    ...authEnvConfig,
  },
});

export default class Scheduler {
  readonly #readTestSuites: ReadTestSuites;

  readonly #executeTest: ExecuteTest;

  readonly #dbo: Dbo;

  #onTick = async (frequency: number): Promise<void> => {
    console.log(`Executing jobs with frequency ${frequency} h`);

    await this.#signIn();

    const jwt = await this.#getJwt();

    const readTestSuitesResult = await this.#readTestSuites.execute(
      { executionFrequency: frequency, activated: true },
      {jwt},
    );

    if (!readTestSuitesResult.success)
      throw new Error(readTestSuitesResult.error);
    if (!readTestSuitesResult.value) throw new Error('Reading jobs failed');
    if (!readTestSuitesResult.value.length) return;

    const testSuites = readTestSuitesResult.value;

    await Promise.all(
      testSuites.map(async (testSuite) => {
        const executeTestResult = await this.#executeTest.execute({testSuiteId: testSuite.id}, {jwt}, this.#dbo.dbConnection);

        if(!executeTestResult.success)
          throw new Error(executeTestResult.error);
      })
    );

    console.log('--------results----------');

    await this.#signOut();
  };

  #cronJobOption: { [key: string]: CronJobParameters } = {
    oneSecondCronJobOption: {
      cronTime: '* * * * * *',
      onTick: () => {
        this.#onTick(1);
      },
    },
    oneHourCronJobOption: {
      cronTime: '0 * * * *',
      onTick: () => {
        this.#onTick(1);
      },
    },
    threeHourCronJobOption: {
      cronTime: '0 */3 * * *',
      onTick: () => {
        this.#onTick(3);
      },
    },
    sixHourCronJobOption: {
      cronTime: '0 */6 * * *',
      onTick: () => {
        this.#onTick(6);
      },
    },
    twelveHourCronJobOption: {
      cronTime: '0 */12 * * *',
      onTick: () => {
        this.#onTick(12);
      },
    },

    oneDayCronJobOption: {
      cronTime: '0 * */1 * *',
      onTick: () => {
        this.#onTick(24);
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
    executeTest: ExecuteTest,
    dbo: Dbo
  ) {
    this.#readTestSuites = readTestSuites;
    this.#executeTest = executeTest;
    this.#dbo = dbo;
  }

  #signIn = async (): Promise<void> => {
    await Auth.signIn(authUsername, authPassword);
  };

  #signOut = async (): Promise<void> => {
    await Auth.signOut();
  };

  #getJwt = async (): Promise<string> => {
    const session = await Auth.currentSession();
    return session.getAccessToken().getJwtToken();
  };

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
