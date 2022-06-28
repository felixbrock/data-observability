import express, { Application } from 'express';
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
