// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import { handleScheduleCreation } from '../../../domain/services/schedule';

import {
  CreateQuantitativeTestResult,
  CreateQuantitativeTestResultAuthDto,
  CreateQuantitativeTestResultRequestDto,
  CreateQuantitativeTestResultResponseDto,
} from '../../../domain/test-result/create-test-result';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class CreateQuantitativeTestResultController extends BaseController {
  readonly #createQuantitativeTestResult: CreateQuantitativeTestResult;

  constructor(
    createQuantitativeTestResult: CreateQuantitativeTestResult,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#createQuantitativeTestResult = createQuantitativeTestResult;
  }

  #buildRequestDto = (httpRequest: Request): CreateQuantitativeTestResultRequestDto => ({
    createObjects: httpRequest.body.createObjects,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): CreateQuantitativeTestResultAuthDto => {
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
        return CreateQuantitativeTestResultController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return CreateQuantitativeTestResultController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateQuantitativeTestResultRequestDto = this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: CreateQuantitativeTestResultResponseDto =
        await this.#createQuantitativeTestResult.execute(requestDto, authDto, connPool);

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return CreateQuantitativeTestResultController.badRequest(res);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test result result value');

      const resultValues = useCaseResult.value.map((el) => el.toDto());

      await handleScheduleCreation(authDto.callerOrgId, 'test', resultValues);

      return CreateQuantitativeTestResultController.ok(res, resultValues, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return CreateQuantitativeTestResultController.fail(
        res,
        'create test result - Internal error occurred'
      );
    }
  }
}
