// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

import {
  CreateTestSuites,
  CreateTestSuitesRequestDto,
  CreateTestSuitesResponseDto,
} from '../../../domain/test-suite/create-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Dbo from '../../persistence/db/mongo-db';

export default class CreateTestSuitesController extends BaseController {
  readonly #createTestSuites: CreateTestSuites;

  readonly #dbo: Dbo;

  constructor(
    createTestSuites: CreateTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#createTestSuites = createTestSuites;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): CreateTestSuitesRequestDto => ({
    createObjects: httpRequest.body.createObjects,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateTestSuitesController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return CreateTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new Error('Unauthorized - Caller organization id missing');

      const requestDto: CreateTestSuitesRequestDto = this.#buildRequestDto(req);


      const useCaseResult: CreateTestSuitesResponseDto =
        await this.#createTestSuites.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection,
        });

      

      if (!useCaseResult.success) {
        return CreateTestSuitesController.badRequest(res);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test suite result value');

      const resultValues = useCaseResult.value.map((el) => el.toDto());

      return CreateTestSuitesController.ok(res, resultValues, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return CreateTestSuitesController.fail(
        res,
        'create test suites - Internal error occurred'
      );
    }
  }
}
