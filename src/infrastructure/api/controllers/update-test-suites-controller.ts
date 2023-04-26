// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateTestSuites,
  UpdateTestSuitesRequestDto,
  UpdateTestSuitesResponseDto,
} from '../../../domain/test-suite/update-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class UpdateTestSuitesController extends BaseController {
  readonly #updateTestSuites: UpdateTestSuites;

  readonly #dbo: Dbo;

  constructor(
    updateTestSuites: UpdateTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#updateTestSuites = updateTestSuites;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): UpdateTestSuitesRequestDto => ({
    updateObjects: httpRequest.body.updateObjects,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return UpdateTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new Error('Unauthorized');

      const requestDto: UpdateTestSuitesRequestDto = this.#buildRequestDto(req);


      const useCaseResult: UpdateTestSuitesResponseDto =
        await this.#updateTestSuites.execute({
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          req: requestDto,
          dbConnection: this.#dbo.dbConnection
        });

      await this.#dbo.releaseConnections();

      if (!useCaseResult.success) {
        return UpdateTestSuitesController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        UpdateTestSuitesController.fail(
          res,
          'Update of test suites failed. Internal error.'
        );

      return UpdateTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return UpdateTestSuitesController.fail(
        res,
        'update test suites - Unknown error occurred'
      );
    }
  }
}
