import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  CreateQualTestSuites,
  CreateQualTestSuitesAuthDto,
  CreateQualTestSuitesRequestDto,
  CreateQualTestSuitesResponseDto,
} from '../../../domain/qual-test-suite/create-qual-test-suites';
import {
  handleScheduleCreation,
} from '../../../domain/services/schedule';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class CreateQualTestSuitesController extends BaseController {
  readonly #createQualTestSuites: CreateQualTestSuites;

  constructor(
    createQualTestSuites: CreateQualTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#createQualTestSuites = createQualTestSuites;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): CreateQualTestSuitesRequestDto => ({
    createObjects: httpRequest.body.createObjects,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): CreateQualTestSuitesAuthDto => {
    if (!userAccountInfo.callerOrgId)
      throw new Error('Unauthorized - Caller organization id missing');

    return {
      callerOrgId: userAccountInfo.callerOrgId,
      isSystemInternal: userAccountInfo.isSystemInternal,
      jwt,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateQualTestSuitesController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return CreateQualTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateQualTestSuitesRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: CreateQualTestSuitesResponseDto =
        await this.#createQualTestSuites.execute(
          requestDto,
          authDto,
          connPool
        );

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return CreateQualTestSuitesController.badRequest(res);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test suite result value');

      const resultValues = useCaseResult.value.map((el) => el.toDto());

      await handleScheduleCreation(authDto.callerOrgId, 'qual-test', resultValues);

      return CreateQualTestSuitesController.ok(
        res,
        resultValues,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return CreateQualTestSuitesController.fail(
        res,
        'create qual test suites - Unknown error occurred'
      );
    }
  }
}
