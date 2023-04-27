// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
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
import Dbo from '../../persistence/db/mongo-db';

export default class DeleteCustomTestSuitesController extends BaseController {
  readonly #deleteCustomTestSuites: DeleteCustomTestSuites;

  readonly #dbo: Dbo;

  constructor(
    deleteCustomTestSuites: DeleteCustomTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#deleteCustomTestSuites = deleteCustomTestSuites;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): DeleteCustomTestSuitesRequestDto => {
    const { targetResourceIds, mode } = httpRequest.body;
    const isStringArray = (obj: unknown): obj is string[] =>
      Array.isArray(obj) && obj.every((item) => typeof item === 'string');
    if (!isStringArray(targetResourceIds) || typeof mode !== 'string')
      throw new Error(
        'Received test suite deletion req params in invalid format'
      );

    return {
      targetResourceIds,
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


      const useCaseResult: DeleteCustomTestSuitesResponseDto =
        await this.#deleteCustomTestSuites.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection,
        });

      

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
