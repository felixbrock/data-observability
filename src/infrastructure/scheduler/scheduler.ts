import { CronJob, CronJobParameters } from 'cron';

export default class Scheduler {
  #cronJobOption: { [key: string]: CronJobParameters } = {
    oneHourCronJobOption: {
      cronTime: '0 * * * *',
      onTick: () => {
        console.log('You will see this message every hour');
      },
    },
    threeHourCronJobOption: {
      cronTime: '0 */3 * * *',
      onTick: () => {
        console.log('You will see this message every second');
      },
    },
    sixHourCronJobOption: {
      cronTime: '0 */6 * * *',
      onTick: () => {
        console.log('You will see this message every second');
      },
    },
    twelveHourCronJobOption: {
      cronTime: '0 */12 * * *',
      onTick: () => {
        console.log('You will see this message every second');
      },
    },

    oneDayCronJobOption: {
      cronTime: '0 * */1 * *',
      onTick: () => {
        console.log('You will see this message every second');
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

  get cronJobOption(): { [key: string]: CronJobParameters } {
    return this.#cronJobOption;
  }

  get jobs(): CronJob[] {
    return this.#jobs;
  }

  run = (): void => this.#jobs.forEach((job) => job.start());
}
