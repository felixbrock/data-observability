// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

import {
  DeleteCustomTestSuites,
  DeleteCustomTestSuitesRequestDto,
  DeleteCustomTestSuitesResponseDto,
  parseMode,
} from '../../../domain/custom-test-suite/delete-custom-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class DeleteCustomTestSuitesController extends BaseController {
  readonly #deleteCustomTestSuites: DeleteCustomTestSuites;

  constructor(
    deleteCustomTestSuites: DeleteCustomTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#deleteCustomTestSuites = deleteCustomTestSuites;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): DeleteCustomTestSuitesRequestDto => {
    const { targetResourceIds, mode } = httpRequest.query;

    if (typeof targetResourceIds !== 'string' || typeof mode !== 'string')
      throw new Error(
        'Received test suite deletion req params in invalid format'
      );

    return {
      targetResourceIds: targetResourceIds.split(','),

      mode: parseMode(mode),
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return DeleteCustomTestSuitesController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return DeleteCustomTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new Error('Unauthorized - Caller organization id missing');

      const requestDto: DeleteCustomTestSuitesRequestDto =
        this.#buildRequestDto(req);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: DeleteCustomTestSuitesResponseDto =
        await this.#deleteCustomTestSuites.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          connPool,
        });

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return DeleteCustomTestSuitesController.badRequest(res);
      }

      return DeleteCustomTestSuitesController.ok(res, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return DeleteCustomTestSuitesController.fail(
        res,
        'delete test suites - Internal error occurred'
      );
    }
  }
}
