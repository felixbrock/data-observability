import { CronJob, CronJobParameters } from 'cron';
import { Frequency } from '../../domain/entities/job';
import { ValidateData } from '../../domain/data-validation-api/validate-data';
import iocRegister from '../ioc-register';
import { ReadTestSuites } from '../../domain/test-suite/read-test-suites';

export default class Scheduler {
  readonly #readTestSuites: ReadTestSuites;

  readonly #validateData: ValidateData;

  #onTick = async (frequency: Frequency): Promise<void> => {
    console.log(frequency);   
    
    const readTestSuitesResult = await this.#readTestSuites.execute(
      { job: {frequency} },
      { isCronJobRequest: true },
      iocRegister.resolve('dbo').dbConnection
    );

    console.log(readTestSuitesResult.value);
    

    if (!readTestSuitesResult.success) throw new Error(readTestSuitesResult.error);
    if (!readTestSuitesResult.value) throw new Error('Reading jobs failed');
    if (!readTestSuitesResult.value.length) return;

    const testData = { b: [1, 2, 3, 104, 3, 3, 3] };
    const testSuites = readTestSuitesResult.value;

    console.log(testSuites);

    const results = await Promise.all(testSuites.map(async (testSuite) => {
      const validateDataResult = await this.#validateData.execute({data: testData, expectationType: testSuite.expectation.type, expectationConfiguration: testSuite.expectation.configuration });

      console.log(validateDataResult.success, validateDataResult.error);
      
      if (!validateDataResult.success) throw new Error(readTestSuitesResult.error);
      if (!validateDataResult.value) throw new Error('Reading jobs failed');
    }));

    console.log('--------results----------');

    console.log(results.length);
    console.log(results[0]);
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

  constructor(readTestSuites: ReadTestSuites, validateData: ValidateData) {
    this.#readTestSuites = readTestSuites;
    this.#validateData = validateData;
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
