// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateQualTestSuites,
  UpdateQualTestSuitesRequestDto,
  UpdateQualTestSuitesResponseDto,
} from '../../../domain/qual-test-suite/update-qual-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

export default class UpdateQualTestSuitesController extends BaseController {
  readonly #updateQualTestSuites: UpdateQualTestSuites;

  constructor(
    updateQualTestSuites: UpdateQualTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#updateQualTestSuites = updateQualTestSuites;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateQualTestSuitesRequestDto => ({
    updateObjects: httpRequest.body.updateObjects,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateQualTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return UpdateQualTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new Error('Unauthorized');

      const requestDto: UpdateQualTestSuitesRequestDto =
        this.#buildRequestDto(req);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: UpdateQualTestSuitesResponseDto =
        await this.#updateQualTestSuites.execute({
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          req: requestDto,
          connPool,
        });

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return UpdateQualTestSuitesController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        UpdateQualTestSuitesController.fail(
          res,
          'Update of test suites failed. Internal error.'
        );

      return UpdateQualTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return UpdateQualTestSuitesController.fail(
        res,
        'update qual test suites - Unknown error occurred'
      );
    }
  }
}
