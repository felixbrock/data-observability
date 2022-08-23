
import ExpressApp from './infrastructure/api/express-app';
import { appConfig } from './config';

const expressApp = new ExpressApp(appConfig.express);

expressApp.start(true);
