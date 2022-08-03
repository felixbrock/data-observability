import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import v1Router from './routes/v1';
import iocRegister from '../ioc-register';
import Scheduler from '../scheduler/scheduler';
import Dbo from '../persistence/db/mongo-db';

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

  start = (): Application => {
    const dbo: Dbo = iocRegister.resolve('dbo');

    dbo.connectToServer((err) => {
      if (err) {
        console.error(err);
        process.exit();
      }

      const scheduler = new Scheduler(
        iocRegister.resolve('readTestSuites'),
        iocRegister.resolve('executeTest'),
        iocRegister.resolve('dbo'),
      );
      
      scheduler.run();

      this.#expressApp.listen(this.#config.port, () => {
        console.log(
          `App listening on port: ${this.#config.port} in ${
            this.#config.mode
          } mode`
        );
      });
    });
    this.configApp();

    return this.#expressApp;
  };

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
