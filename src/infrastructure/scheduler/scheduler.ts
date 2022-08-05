import { CronJob, CronJobParameters } from 'cron';
import axios, { AxiosRequestConfig} from 'axios';
import { ReadTestSuites } from '../../domain/test-suite/read-test-suites';
import Dbo from '../persistence/db/mongo-db';
import { authEnvConfig } from '../../config';
import { ExecuteTest } from '../../domain/test-execution-api/execute-test';

export default class Scheduler {
  readonly #readTestSuites: ReadTestSuites;

  readonly #executeTest: ExecuteTest;

  readonly #dbo: Dbo;

  #onTick = async (frequency: number): Promise<void> => {
    try {
      console.log(`Executing jobs with frequency ${frequency} h`);

      const jwt = await this.#getJwt();

      const readTestSuitesResult = await this.#readTestSuites.execute(
        { executionFrequency: frequency, activated: true },
        { jwt}
      );

      if (!readTestSuitesResult.success)
        throw new Error(readTestSuitesResult.error);
      if (!readTestSuitesResult.value) throw new Error('Reading jobs failed');
      if (!readTestSuitesResult.value.length) return;

      const testSuites = readTestSuitesResult.value;

      await Promise.all(
        testSuites.map(async (testSuite) => {
          const executeTestResult = await this.#executeTest.execute(
            { testSuiteId: testSuite.id },
            { jwt },
            this.#dbo.dbConnection
          );

          if (!executeTestResult.success)
            throw new Error(executeTestResult.error);
        })
      );

      console.log('--------results----------');
    } catch (error: unknown) {
      if (typeof error === 'string') {console.trace(error); return;};
      if (error instanceof Error) {console.trace(error.message); return;};
      console.trace('Unknown error occured');
    }
  };

  #cronJobOption: { [key: string]: CronJobParameters } = {
    // oneSecondCronJobOption: {
    //   cronTime: '* * * * * *',
    //   onTick: () => {
    //     this.#onTick(1);
    //   },
    // },
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
    // new CronJob(this.#cronJobOption.oneSecondCronJobOption),
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

  #getJwt = async (): Promise<string> => {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${authEnvConfig.userPoolWebClientId}:${authEnvConfig.authClientSecret}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: authEnvConfig.userPoolWebClientId,
        }),
      };

      const response = await axios.post(
        authEnvConfig.tokenUrl,
        undefined,
        config
      );
      const jsonResponse = response.data;
      if (response.status !== 200) throw new Error(jsonResponse.message);
      if (!jsonResponse.access_token)
        throw new Error('Did not receive an access token');
      return jsonResponse.access_token;
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  run = async (): Promise<void> => {
    try {
      this.#jobs.forEach((job) => job.start());

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');
    } catch (error: unknown) {
      if (typeof error === 'string') console.trace(error);
      if (error instanceof Error) console.trace(error.message);
      console.trace('Unknown error occured');
    }
  };
}
