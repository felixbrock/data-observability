// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import {
  UpdateTestSuite,
  UpdateTestSuiteAuthDto,
  UpdateTestSuiteRequestDto,
  UpdateTestSuiteResponseDto,
} from '../../../domain/test-suite/update-test-suite';

import {
  BaseController,
  CodeHttp,
} from '../../shared/base-controller';

export default class UpdateTestSuiteController extends BaseController {
  readonly #updateTestSuite: UpdateTestSuite;

  constructor(updateTestSuite: UpdateTestSuite) {
    super();
    this.#updateTestSuite = updateTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): UpdateTestSuiteRequestDto => ({
    id: httpRequest.params.testSuiteId,
    activated: httpRequest.body.activated,
  });

  #buildAuthDto = (jwt: string): UpdateTestSuiteAuthDto => ({
    jwt
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

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
      const authDto: UpdateTestSuiteAuthDto = this.#buildAuthDto(
        jwt
      );

      const useCaseResult: UpdateTestSuiteResponseDto =
        await this.#updateTestSuite.execute(
          requestDto,
          authDto,
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
