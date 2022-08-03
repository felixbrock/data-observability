import { CronJob, CronJobParameters } from 'cron';
import CryptoJS  from 'crypto-js';
import {
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { ReadTestSuites } from '../../domain/test-suite/read-test-suites';
import Dbo from '../persistence/db/mongo-db';
import { authClientRegion, authPassword, authEnvConfig, authUsername } from '../../config';
import { ExecuteTest } from '../../domain/test-execution-api/execute-test';

// Auth.configure({
//   Auth: {
//     region: 'eu-central-1',
//     mandatorySignIn: true,
//     ...authEnvConfig,
//   },
// });

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
      { jwt }
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

  #getAccessToken = async (): Promise<void> => {
    const client = new CognitoIdentityProviderClient({ region: authClientRegion });

    const sha256 = CryptoJS.algo.SHA256.create();
    sha256.update("1cod73rromr7s4scsltlfbtuo42bnsa5dfhk4mbs2omd094bjnp");
    sha256.update(`${authUsername}${authEnvConfig.userPoolWebClientId}`);

    const hash = sha256.finalize();
    
    const command = new AdminInitiateAuthCommand({
      ClientId: authEnvConfig.userPoolWebClientId,
      UserPoolId: authEnvConfig.userPoolId,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: authUsername,
        PASSWORD: authPassword,
        SECRET_HASH: hash.toString(CryptoJS.enc.Base64)
      }
        // clientId:"2lssvcgnbg486t9ha18oh7pj0s", 
        // AuthFlow:"USER_PASSWORD_AUTH" , 
        // AuthParameters:{
        //     username: 'testUserEmail@test.com', //placeholder email address
        //     password: 'Test1!Test'
        // }
    });
    const response =  await client.send(command);
    console.log(response);
    // when I run this, the access token is stored and I can take it and put it where needed in the code.

    // return response.AuthenticationResults.AccessToken
};

  #signIn = async (): Promise<void> => {
    await this.#getAccessToken();
    // const config: CognitoIdentityProviderClientConfig = {region: 'eu-central-1', };
    // const client = new CognitoIdentityProviderClient(config);

    // const input: InitiateAuthCommandInput = {};
    // const command = new InitiateAuthCommand(input);
    // const response = await client.send(command);
  };

  #signOut = async (): Promise<void> => {
    console.log('signout');

    // await Auth.signOut();
  };

  #getJwt = async (): Promise<string> => {
    // const session = await Auth.currentSession();
    // return session.getAccessToken().getJwtToken();
    console.log('getJWT');
    
    return Promise.resolve('todo');
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
