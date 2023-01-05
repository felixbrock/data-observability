// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  parseTestType,
  TestType,
} from '../../../domain/entities/quant-test-suite';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import { handleScheduleCreation } from '../../../domain/services/schedule';

import {
  HandleQuantTestExecutionResult,
  HandleQuantTestExecutionResultAuthDto,
  HandleQuantTestExecutionResultRequestDto,
  HandleQuantTestExecutionResultResponseDto,
} from '../../../domain/test-execution-api/handle-quant-test-execution-result';
import {
  MaterializationType,
  parseMaterializationType,
} from '../../../domain/value-types/materialization-type';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class HandleQuantTestExecutionResultController extends BaseController {
  readonly #handleQuantTestExecutionResult: HandleQuantTestExecutionResult;

  readonly #dbo: Dbo;

  constructor(
    handleQuantTestExecutionResult: HandleQuantTestExecutionResult,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#handleQuantTestExecutionResult = handleQuantTestExecutionResult;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): HandleQuantTestExecutionResultRequestDto => {
    const {
      executionId,
      testSuiteId,
      isWarmup,
      testData,
      alertData,
      targetResourceId,
      organizationId,
    } = httpRequest.body;

    const testType: TestType = parseTestType(httpRequest.body.testType);

    const isTestData = (
      obj: unknown
    ): obj is {
      executedOn: string;
      isAnomolous: boolean;
      modifiedZScore: number;
      deviation: number;
    } =>
      !!obj &&
      typeof obj === 'object' &&
      'executedOn' in obj &&
      typeof obj.executedOn === 'string' &&
      'isAnomolous' in obj &&
      typeof obj.isAnomolous === 'boolean' &&
      'modifiedZScore' in obj &&
      typeof obj.modifiedZScore === 'number' &&
      'deviation' in obj &&
      typeof obj.deviation === 'number';
    if (testData && !isTestData(testData))
      throw new Error('Incorrect testData obj provided');

    const isAlertData = (
      obj: unknown
    ): obj is {
      alertId: string;
      message: string;
      value: number;
      expectedUpperBound: number;
      expectedLowerBound: number;
      databaseName: string;
      schemaName: string;
      materializationName: string;
      materializationType: MaterializationType;
      columnName?: string;
    } =>
      !!obj &&
      typeof obj === 'object' &&
      'alertId' in obj &&
      typeof obj.alertId === 'string' &&
      'message' in obj &&
      typeof obj.message === 'string' &&
      'value' in obj &&
      typeof obj.value === 'number' &&
      'expectedUpperBound' in obj &&
      typeof obj.expectedUpperBound === 'number' &&
      'expectedLowerBound' in obj &&
      typeof obj.expectedLowerBound === 'number' &&
      'databaseName' in obj &&
      typeof obj.databaseName === 'string' &&
      'schemaName' in obj &&
      typeof obj.schemaName === 'string' &&
      'materializationName' in obj &&
      typeof obj.materializationName === 'string' &&
      'materializationType' in obj &&
      parseMaterializationType(obj.materializationType) &&
      (!('columnName' in obj) ||
        ('columnName' in obj && typeof obj.columnName === 'string'));
    if (alertData && !isAlertData(alertData))
      throw new Error('Incorrect alertData obj provided');

    if (
      typeof testSuiteId !== 'string' &&
      typeof executionId !== 'string' &&
      typeof isWarmup !== 'boolean' &&
      typeof targetResourceId !== 'string' &&
      typeof organizationId !== 'string'
    )
      throw new Error('Received invalid result values');

    return {
      executionId,
      testType,
      isWarmup,
      organizationId,
      targetResourceId,
      testSuiteId,
      alertData,
      testData,
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): HandleQuantTestExecutionResultAuthDto => {
    if (!userAccountInfo.isSystemInternal)
      throw new Error('Unauthorized - Caller organization id missing');

    return {
      isSystemInternal: userAccountInfo.isSystemInternal,
      jwt,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return HandleQuantTestExecutionResultController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return HandleQuantTestExecutionResultController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: HandleQuantTestExecutionResultRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: HandleQuantTestExecutionResultResponseDto =
        await this.#handleQuantTestExecutionResult.execute(
          requestDto,
          authDto,
          this.#dbo
        );


      if (!useCaseResult.success) {
        return HandleQuantTestExecutionResultController.badRequest(res);
      }
returns null
      xxxxxxxxif (!useCaseResult.value)
        throw new Error('Missing handle test result result value');

      const resultValues = useCaseResult.value.map((el) => el.toDto());

      await handleScheduleCreation(authDto.callerOrgId, 'test', resultValues);

      return HandleQuantTestExecutionResultController.ok(
        res,
        resultValues,
        CodeHttp.HANDLED
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return HandleQuantTestExecutionResultController.fail(
        res,
        'handle test result - Internal error occurred'
      );
    }
  }
}
