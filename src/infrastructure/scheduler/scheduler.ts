import { CronJob, CronJobParameters} from 'cron';
import { citoDataOrganizationId } from '../../config';
import { Frequency } from '../../domain/entities/job';
import { ReadJobs } from '../../domain/job/read-jobs';
import iocRegister from '../ioc-register';

export default class Scheduler {

  readonly #readJobs: ReadJobs;
  
  #onTick = async (frequency: Frequency): Promise<void> => {
    const result = await this.#readJobs.execute(
      { frequency },
      { organizationId: citoDataOrganizationId },
      iocRegister.resolve('dbo').dbConnection
    );

    console.log('--------results----------');
    
    console.log(result.value);
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

  constructor(readJobs: ReadJobs) {
    this.#readJobs = readJobs;
  }

  run = async (): Promise<void> => {

    this.#jobs.forEach((job) => job.start());
  };
}
