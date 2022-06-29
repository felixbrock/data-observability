// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateTestSuite,
  CreateTestSuiteAuthDto,
  CreateTestSuiteRequestDto,
  CreateTestSuiteResponseDto,
} from '../../../domain/test-suite/create-test-suite';
import { buildTestSuiteDto } from '../../../domain/test-suite/test-suite-dto';
import { IDb } from '../../../domain/services/i-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateTestSuiteController extends BaseController {
  readonly #createTestSuite: CreateTestSuite;

  readonly #getAccounts: GetAccounts;

  readonly #db: IDb;

  constructor(createTestSuite: CreateTestSuite, getAccounts: GetAccounts, db: IDb) {
    super();
    this.#createTestSuite = createTestSuite;
    this.#getAccounts = getAccounts;
    this.#db = db;
  }

  #buildRequestDto = (httpRequest: Request): CreateTestSuiteRequestDto => ({
    expecationType: httpRequest.body.expecationType,
    expectationConfiguration: httpRequest.body.expectationConfiguration,
    jobFrequency: httpRequest.body.jobFrequency,
    targetId: httpRequest.body.targetId
  });

  #buildAuthDto = (userAccountInfo: UserAccountInfo): CreateTestSuiteAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return CreateTestSuiteController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await CreateTestSuiteInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return CreateTestSuiteInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: CreateTestSuiteRequestDto = this.#buildRequestDto(req);
      // const authDto: CreateTestSuiteAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const client = this.#db.createClient();
      const dbConnection = await this.#db.connect(client);

      const useCaseResult: CreateTestSuiteResponseDto =
        await this.#createTestSuite.execute(
          requestDto,
          {
            organizationId: 'todo',
          },
          dbConnection
        );

      await this.#db.close(client);

      if (!useCaseResult.success) {
        return CreateTestSuiteController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? buildTestSuiteDto(useCaseResult.value)
        : useCaseResult.value;

      return CreateTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return CreateTestSuiteController.fail(res, error);
      if (error instanceof Error)
        return CreateTestSuiteController.fail(res, error);
      return CreateTestSuiteController.fail(res, 'Unknown error occured');
    }
  }
}
