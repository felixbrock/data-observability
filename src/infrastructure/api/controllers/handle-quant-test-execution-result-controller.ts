// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  parseTestType,
  TestType,
} from '../../../domain/entities/quant-test-suite';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

import {
  HandleQuantTestExecutionResult,
  HandleQuantTestExecutionResultAuthDto,
  HandleQuantTestExecutionResultRequestDto,
  HandleQuantTestExecutionResultResponseDto,
} from '../../../domain/test-execution-api/handle-quant-test-execution-result';
import {
  QuantTestAlertData,
  QuantTestTestData,
} from '../../../domain/test-execution-api/quant-test-execution-result-dto';
import { parseMaterializationType } from '../../../domain/value-types/materialization-type';
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

  #isObj = (obj: unknown): obj is { [key: string]: unknown } =>
    !obj ||
    typeof obj !== 'object' ||
    Object.keys(obj).some((el) => typeof el !== 'string');

  #isTestData = (obj: unknown): obj is QuantTestTestData => {
    if (!this.#isObj(obj)) return false;

    const { executedOn, isAnomolous, modifiedZScore, deviation } = obj;

    if (
      !executedOn ||
      executedOn !== 'string' ||
      !isAnomolous ||
      isAnomolous !== 'boolean' ||
      !modifiedZScore ||
      modifiedZScore !== 'number' ||
      !deviation ||
      deviation !== 'number'
    )
      return false;

    return true;
  };

  #isAlertData = (obj: unknown): obj is QuantTestAlertData => {
    if (!this.#isObj(obj)) return false;

    const {
      alertId,
      message,
      value,
      expectedUpperBound,
      expectedLowerBound,
      databaseName,
      schemaName,
      materializationName,
      materializationType,
      columnName,
    } = obj;

    if (
      !alertId ||
      typeof alertId === 'string' ||
      !message ||
      typeof message === 'string' ||
      !value ||
      typeof value === 'number' ||
      !expectedLowerBound ||
      typeof expectedLowerBound === 'number' ||
      !expectedUpperBound ||
      typeof expectedUpperBound === 'number' ||
      !databaseName ||
      typeof databaseName === 'string' ||
      !schemaName ||
      typeof schemaName === 'string' ||
      !materializationName ||
      typeof materializationName === 'string' ||
      !materializationType ||
      parseMaterializationType(materializationType) ||
      (columnName && typeof columnName !== 'string')
    )
      return false;

    return true;
  };

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

    if (testData && !this.#isTestData(testData))
      throw new Error('Incorrect testData obj provided');

    if (alertData && !this.#isAlertData(alertData))
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

      return HandleQuantTestExecutionResultController.ok(res, CodeHttp.CREATED);
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
