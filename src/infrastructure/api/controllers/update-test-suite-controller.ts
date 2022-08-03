// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateTestSuite,
  UpdateTestSuiteRequestDto,
  UpdateTestSuiteResponseDto,
} from '../../../domain/test-suite/update-test-suite';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
} from '../../shared/base-controller';

export default class UpdateTestSuiteController extends BaseController {
  readonly #updateTestSuite: UpdateTestSuite;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(updateTestSuite: UpdateTestSuite, getAccounts: GetAccounts, dbo: Dbo) {
    super();
    this.#updateTestSuite = updateTestSuite;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): UpdateTestSuiteRequestDto => ({
    id: httpRequest.params.testSuiteId,
    activated: httpRequest.body.activated,
  });

  // #buildAuthDto = (userAccountInfo: UserAccountInfo): UpdateTestSuiteAuthDto => ({
  //   organizationId: userAccountInfo.organizationId,
  // });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return UpdateTestSuiteController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await UpdateTestSuiteInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return UpdateTestSuiteInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: UpdateTestSuiteRequestDto = this.#buildRequestDto(req);
      // const authDto: UpdateTestSuiteAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const useCaseResult: UpdateTestSuiteResponseDto =
        await this.#updateTestSuite.execute(
          requestDto,
          {
            jwt: 'todo',
          },
        );


      if (!useCaseResult.success) {
        return UpdateTestSuiteController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value;

      return UpdateTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return UpdateTestSuiteController.fail(res, error);
      if (error instanceof Error)
        return UpdateTestSuiteController.fail(res, error);
      return UpdateTestSuiteController.fail(res, 'Unknown error occured');
    }
  }
}
