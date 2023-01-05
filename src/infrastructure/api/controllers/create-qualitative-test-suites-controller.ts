import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  CreateQualitativeTestSuites,
  CreateQualitativeTestSuitesAuthDto,
  CreateQualitativeTestSuitesRequestDto,
  CreateQualitativeTestSuitesResponseDto,
} from '../../../domain/qualitative-test-suite/create-qualitative-test-suites';
import {
  handleScheduleCreation,
} from '../../../domain/services/schedule';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class CreateQualitativeTestSuitesController extends BaseController {
  readonly #createQualitativeTestSuites: CreateQualitativeTestSuites;

  constructor(
    createQualitativeTestSuites: CreateQualitativeTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#createQualitativeTestSuites = createQualitativeTestSuites;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): CreateQualitativeTestSuitesRequestDto => ({
    createObjects: httpRequest.body.createObjects,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): CreateQualitativeTestSuitesAuthDto => {
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
        return CreateQualitativeTestSuitesController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return CreateQualitativeTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateQualitativeTestSuitesRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: CreateQualitativeTestSuitesResponseDto =
        await this.#createQualitativeTestSuites.execute(
          requestDto,
          authDto,
          connPool
        );

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return CreateQualitativeTestSuitesController.badRequest(res);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test suite result value');

      const resultValues = useCaseResult.value.map((el) => el.toDto());

      await handleScheduleCreation(authDto.callerOrgId, 'qualitative-test', resultValues);

      return CreateQualitativeTestSuitesController.ok(
        res,
        resultValues,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return CreateQualitativeTestSuitesController.fail(
        res,
        'create qualitative test suites - Unknown error occurred'
      );
    }
  }
}
