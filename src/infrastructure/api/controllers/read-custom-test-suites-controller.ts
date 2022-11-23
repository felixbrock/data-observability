// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import {
  ReadCustomTestSuites,
  ReadCustomTestSuitesAuthDto,
  ReadCustomTestSuitesRequestDto,
  ReadCustomTestSuitesResponseDto,
} from '../../../domain/custom-test-suite/read-custom-test-suites';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import Result from '../../../domain/value-types/transient-types/result';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

export default class ReadCustomTestSuitesController extends BaseController {
  readonly #readCustomTestSuites: ReadCustomTestSuites;

  

  constructor(
    readCustomTestSuites: ReadCustomTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readCustomTestSuites = readCustomTestSuites;
  }

  #buildRequestDto = (httpRequest: Request): ReadCustomTestSuitesRequestDto => {
    const { executionFrequency, activated } = httpRequest.query;

    if (
      activated &&
      typeof activated === 'string' &&
      !['true', 'false'].includes(activated)
    )
      throw new TypeError(
        "activated query parameter must either be 'true' or 'false'"
      );

    return {
      activated: activated ? activated === 'true' : undefined,
      executionFrequency: Number(executionFrequency),
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadCustomTestSuitesAuthDto => ({
    jwt,
    isSystemInternal: userAccountInfo.isSystemInternal,
    callerOrgId: userAccountInfo.callerOrgId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadCustomTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(
          jwt,
        );

      if (!getUserAccountInfoResult.success)
        return ReadCustomTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadCustomTestSuitesRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadCustomTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const connPool = await this.createConnectionPool(jwt, createPool);


      const useCaseResult: ReadCustomTestSuitesResponseDto =
        await this.#readCustomTestSuites.execute(requestDto, authDto, connPool);

      if (!useCaseResult.success) {
        return ReadCustomTestSuitesController.badRequest(
          res
        );
      }

      const result = useCaseResult.value;
      if (!result)
        return ReadCustomTestSuitesController.fail(
          res,
          'Readin custom tests failed. Internal error.'
        );

        await connPool.drain();
        await connPool.clear();

      return ReadCustomTestSuitesController.ok(
        res,
        result,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return ReadCustomTestSuitesController.fail(res, 'read custom test suites - Unknown error occured');
    }
  }
}
