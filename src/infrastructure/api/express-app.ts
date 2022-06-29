import express, { Application } from 'express';
import {CronJob, CronJobParameters} from 'cron';
import cors from 'cors';
import helmet from 'helmet';
import v1Router from './routes/v1';

interface AppConfig {
  port: number;
  mode: string;
}

export default class ExpressApp {
  #expressApp: Application;

  #config: AppConfig;

  constructor(config: AppConfig) {
    this.#expressApp = express();
    this.#config = config;
  }

  start(): Application {
    this.configApp();

    this.#expressApp.listen(this.#config.port, () => {
      console.log(
        `App listening on port: ${this.#config.port} in ${
          this.#config.mode
        } mode`
      );
    });

    const oneHourCronJobOption: CronJobParameters = {
      cronTime: '0 * * * *',
      onTick: () => {
            console.log('You will see this message every second');
          },
    };

    const oneHourCronJob = new CronJob(oneHourCronJobOption);
    oneHourCronJob.start();

    const threeHourCronJobOption: CronJobParameters = {
      cronTime: '0 */3 * * *',
      onTick: () => {
            console.log('You will see this message every second');
          },
    };

    const threeHourJobOption = new CronJob(threeHourCronJobOption);
    threeHourJobOption.start();

    const sixHourCronJobOption: CronJobParameters = {
      cronTime: '0 */6 * * *',
      onTick: () => {
            console.log('You will see this message every second');
          },
    };

    const sixHourJobOption = new CronJob(sixHourCronJobOption);
    sixHourJobOption.start();

    const twelveHourCronJobOption: CronJobParameters = {
      cronTime: '0 */12 * * *',
      onTick: () => {
            console.log('You will see this message every second');
          },
    };

    const twelveHourJobOption = new CronJob(twelveHourCronJobOption);
    twelveHourJobOption.start();

    const oneDayCronJobOption: CronJobParameters = {
      cronTime: '0 * */1 * *',
      onTick: () => {
            console.log('You will see this message every second');
          },
    };

    const oneDayJobOption = new CronJob(oneDayCronJobOption);
    oneDayJobOption.start();

    return this.#expressApp;
  }

  private configApp(): void {
    this.#expressApp.use(express.json());
    this.#expressApp.use(express.urlencoded({ extended: true }));
    this.#expressApp.use(cors());
    // this.#expressApp.use(compression());
    // // this.#expressApp.use(morgan("combined"));
    this.#expressApp.use(helmet());
    this.#expressApp.use(v1Router);
  }
}
