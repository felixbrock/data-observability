// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

import {
  DeleteQualTestSuites,
  DeleteQualTestSuitesRequestDto,
  DeleteQualTestSuitesResponseDto,
  parseMode,
} from '../../../domain/qual-test-suite/delete-qual-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class DeleteQualTestSuitesController extends BaseController {
  readonly #deletequalTestSuites: DeleteQualTestSuites;

  constructor(
    deletequalTestSuites: DeleteQualTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#deletequalTestSuites = deletequalTestSuites;
  }

  #buildRequestDto = (httpRequest: Request): DeleteQualTestSuitesRequestDto => {
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
        return DeleteQualTestSuitesController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return DeleteQualTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new Error('Unauthorized - Caller organization id missing');

      const requestDto: DeleteQualTestSuitesRequestDto =
        this.#buildRequestDto(req);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: DeleteQualTestSuitesResponseDto =
        await this.#deletequalTestSuites.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          connPool,
        });

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return DeleteQualTestSuitesController.badRequest(res);
      }

      return DeleteQualTestSuitesController.ok(res, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return DeleteQualTestSuitesController.fail(
        res,
        'deletequal test suites - Internal error occurred'
      );
    }
  }
}
