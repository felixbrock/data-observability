import { CronJob, CronJobParameters} from 'cron';
import { citoDataOrganizationId } from '../../config';
import { Frequency } from '../../domain/entities/job';
import { ReadJobs } from '../../domain/job/read-jobs';
import { DbConnection} from '../../domain/services/i-db';
import { cronJobDbConnection } from '../persistence/db/mongo-db';

export default class Scheduler {

  readonly #readJobs: ReadJobs;
  
  #dbConnection: DbConnection;

  #onTick = async (frequency: Frequency): Promise<void> => {
    const result = this.#readJobs.execute(
      { frequency },
      { organizationId: citoDataOrganizationId },
      this.#dbConnection
    );

    console.log(result);
  };

  #cronJobOption: { [key: string]: CronJobParameters } = {
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
    this.#dbConnection = await cronJobDbConnection();

    this.#jobs.forEach((job) => job.start());
  };
}
