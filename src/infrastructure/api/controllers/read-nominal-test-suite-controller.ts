// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import {
  ReadNominalTestSuite,
  ReadNominalTestSuiteAuthDto,
  ReadNominalTestSuiteRequestDto,
  ReadNominalTestSuiteResponseDto,
} from '../../../domain/nominal-test-suite/read-nominal-test-suite';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

export default class ReadNominalTestSuiteController extends BaseController {
  readonly #readNominalTestSuite: ReadNominalTestSuite;

  constructor(
    readNominalTestSuite: ReadNominalTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readNominalTestSuite = readNominalTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): ReadNominalTestSuiteRequestDto => {
    const { id } = httpRequest.params;

    return {
      id,
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadNominalTestSuiteAuthDto => ({
    jwt,
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadNominalTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadNominalTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadNominalTestSuiteRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadNominalTestSuiteAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: ReadNominalTestSuiteResponseDto =
        await this.#readNominalTestSuite.execute(requestDto, authDto, connPool);

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return ReadNominalTestSuiteController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.toDto()
        : useCaseResult.value;

      return ReadNominalTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return ReadNominalTestSuiteController.fail(
        res,
        'read nominal test suite - Unknown error occured'
      );
    }
  }
}
