// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import {
  ReadCustomTestSuite,
  ReadCustomTestSuiteAuthDto,
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

export default class ReadCustomTestSuiteController extends BaseController {
  readonly #readCustomTestSuite: ReadCustomTestSuite;

  constructor(
    readCustomTestSuite: ReadCustomTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readCustomTestSuite = readCustomTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): ReadCustomTestSuiteRequestDto => {
    const { id } = httpRequest.params;

    return {
      id,
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadCustomTestSuiteAuthDto => ({
    jwt,
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadCustomTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(
          jwt,
        );

      if (!getUserAccountInfoResult.success)
        return ReadCustomTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadCustomTestSuiteAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: ReadCustomTestSuiteResponseDto =
        await this.#readCustomTestSuite.execute(requestDto, authDto, connPool);

      if (!useCaseResult.success) {
        return ReadCustomTestSuiteController.badRequest(res);
      }

      const result = useCaseResult.value;
      if (!result)
        return ReadCustomTestSuiteController.notFound(
          res,
          'Custom test suite not created. Internal error.'
        );

      await connPool.drain();
      await connPool.clear();

      return ReadCustomTestSuiteController.ok(res, result, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return ReadCustomTestSuiteController.fail(
        res,
        'read custom test suite - Unknown error occured'
      );
    }
  }
}
