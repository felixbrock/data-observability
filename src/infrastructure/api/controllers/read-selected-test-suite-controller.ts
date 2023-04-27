import { Request, Response } from 'express';
import {
  ReadSelectedTestSuite,
  ReadSelectedTestSuiteRequestDto,
  ReadSelectedTestSuiteResponseDto,
} from '../../../domain/front-end-api/read-selected-test-suite';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadSelectedTestSuiteController extends BaseController {
  readonly #readSelectedTestSuite: ReadSelectedTestSuite;

  readonly #dbo: Dbo;

  constructor(
    readSelectedTestSuite: ReadSelectedTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readSelectedTestSuite = readSelectedTestSuite;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadSelectedTestSuiteRequestDto => {
    const { targetResourceId, activated } = httpRequest.query;

    if (targetResourceId === undefined || typeof targetResourceId !== 'string')
      throw new Error("Missing target resource id");
    
    if (activated === undefined || typeof activated !== 'string')
      throw new Error("Missing activated value");

    return {
      targetResourceId,
      activated
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadSelectedTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadSelectedTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new ReferenceError('Unauthorized - Caller organization id missing');

      const requestDto: ReadSelectedTestSuiteRequestDto = this.#buildRequestDto(req);


      const useCaseResult: ReadSelectedTestSuiteResponseDto =
        await this.#readSelectedTestSuite.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection
        });

      

      if (!useCaseResult.success) {
        return ReadSelectedTestSuiteController.badRequest(res);
      }

      const resultValue = JSON.stringify(useCaseResult.value);
      console.log(resultValue);

      return ReadSelectedTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadSelectedTestSuiteController.fail(
        res,
        'read test suite - Unknown error occurred'
      );
    }
  }
}
