// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import {
  ReadQualTestSuite,
  ReadQualTestSuiteRequestDto,
  ReadQualTestSuiteResponseDto,
} from '../../../domain/qual-test-suite/read-qual-test-suite';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

export default class ReadQualTestSuiteController extends BaseController {
  readonly #readQualTestSuite: ReadQualTestSuite;

  constructor(
    readQualTestSuite: ReadQualTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readQualTestSuite = readQualTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): ReadQualTestSuiteRequestDto => {
    const { id } = httpRequest.params;

    return {
      id,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadQualTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadQualTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadQualTestSuiteRequestDto =
        this.#buildRequestDto(req);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: ReadQualTestSuiteResponseDto =
        await this.#readQualTestSuite.execute({
          req: requestDto,
          connPool,
        });

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return ReadQualTestSuiteController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.toDto()
        : useCaseResult.value;

      return ReadQualTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadQualTestSuiteController.fail(
        res,
        'read qual test suite - Unknown error occurred'
      );
    }
  }
}
