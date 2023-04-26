// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import {
  ReadCustomTestSuite,
  ReadCustomTestSuiteRequestDto,
  ReadCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/read-custom-test-suite';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadCustomTestSuiteController extends BaseController {
  readonly #readCustomTestSuite: ReadCustomTestSuite;

  readonly #dbo: Dbo;

  constructor(
    readCustomTestSuite: ReadCustomTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readCustomTestSuite = readCustomTestSuite;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadCustomTestSuiteRequestDto => {
    const { id } = httpRequest.params;

    return {
      id,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadCustomTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadCustomTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new Error('Unauthorized - Caller organization id missing');

      const requestDto: ReadCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);


      const useCaseResult: ReadCustomTestSuiteResponseDto =
        await this.#readCustomTestSuite.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection
        });

      await this.#dbo.releaseConnections();

      if (!useCaseResult.success) {
        return ReadCustomTestSuiteController.badRequest(res);
      }

      const result = useCaseResult.value;
      if (!result)
        return ReadCustomTestSuiteController.notFound(
          res,
          'Custom test suite not created. Internal error.'
        );

      return ReadCustomTestSuiteController.ok(res, result, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadCustomTestSuiteController.fail(
        res,
        'read custom test suite - Unknown error occurred'
      );
    }
  }
}
