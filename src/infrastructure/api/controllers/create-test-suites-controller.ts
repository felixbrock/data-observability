// TODO: Violation of control flow. DI for express instead
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { appConfig } from '../../../config';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  createCronJob,
  getAutomaticCronExpression,
  getFrequencyCronExpression,
} from '../../../domain/services/cron-job';

import {
  CreateTestSuites,
  CreateTestSuitesAuthDto,
  CreateTestSuitesRequestDto,
  CreateTestSuitesResponseDto,
} from '../../../domain/test-suite/create-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class CreateTestSuitesController extends BaseController {
  readonly #createTestSuites: CreateTestSuites;

  constructor(
    createTestSuites: CreateTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#createTestSuites = createTestSuites;
  }

  #buildRequestDto = (httpRequest: Request): CreateTestSuitesRequestDto => ({
    createObjects: httpRequest.body.createObjects,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): CreateTestSuitesAuthDto => {
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

      const requestDto: CreateTestSuitesRequestDto = this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: CreateTestSuitesResponseDto =
        await this.#createTestSuites.execute(requestDto, authDto, connPool);

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return CreateTestSuitesController.badRequest(res);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test suite result value');

      const resultValues = useCaseResult.value.map((el) => el.toDto());

      const eventBridgeClient = new EventBridgeClient({
        region: appConfig.cloud.region,
      });

      await Promise.all(
        resultValues.map(async (el) => {
          let cron: string;
          switch (el.executionType) {
            case 'automatic':
              cron = getAutomaticCronExpression();
              break;
            case 'frequency':
              cron = getFrequencyCronExpression(el.executionFrequency);
              break;
            case 'individual':
              if (!el.cron)
                throw new Error(
                  `Created test suite ${el.id} misses cron value while holding execution type "individual"`
                );
              cron = el.cron;
              break;
            default:
              throw new Error('Unhandled execution type');
          }

          await createCronJob(cron, el.id, authDto.callerOrgId, {
            testSuiteType: 'test',
            executionType: el.executionType,
          }, eventBridgeClient);
        })
      );

      eventBridgeClient.destroy();

      return CreateTestSuitesController.ok(res, resultValues, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return CreateTestSuitesController.fail(
        res,
        'create test suites - Internal error occured'
      );
    }
  }
}
