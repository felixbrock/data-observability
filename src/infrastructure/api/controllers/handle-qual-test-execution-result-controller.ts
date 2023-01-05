// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  parseQualTestType,
  QualTestType,
} from '../../../domain/entities/qual-test-suite';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

import {
  HandleQualTestExecutionResult,
  HandleQualTestExecutionResultAuthDto,
  HandleQualTestExecutionResultRequestDto,
  HandleQualTestExecutionResultResponseDto,
} from '../../../domain/test-execution-api/handle-qual-test-execution-result';
import { QualTestTestData } from '../../../domain/test-execution-api/qual-test-execution-result-dto';
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

export default class HandleQualTestExecutionResultController extends BaseController {
  readonly #handleQualTestExecutionResult: HandleQualTestExecutionResult;

  readonly #dbo: Dbo;

  constructor(
    handleQualTestExecutionResult: HandleQualTestExecutionResult,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#handleQualTestExecutionResult = handleQualTestExecutionResult;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): HandleQualTestExecutionResultRequestDto => {
    const {
      testSuiteId,
      executionId,
      testData,
      alertData,
      targetResourceId,
      organizationId,
    } = httpRequest.body;

    const testType: QualTestType = parseQualTestType(httpRequest.body.testType);

    const isTestData = (obj: unknown): obj is QualTestTestData => {
      if (
        !obj ||
        typeof obj !== 'object' ||
        Object.keys(obj).some((el) => typeof el !== 'string')
      )
        return false;

      const localObj: { [key: string]: unknown } = obj;

      const { executedOn, isAnomolous, modifiedZScore, deviation } = localObj;

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
    };
    if (!isTestData(testData))
      throw new Error('Incorrect testData obj provided');

    const isAlertData = (
      obj: unknown
    ): obj is {
      alertId: string;
      message: string;
      databaseName: string;
      schemaName: string;
      materializationName: string;
      materializationType: MaterializationType;
    } =>
      !!obj &&
      typeof obj === 'object' &&
      'alertId' in obj &&
      typeof (obj as { alertId: unknown }).alertId === 'string' &&
      'message' in obj &&
      typeof obj.message === 'string' &&
      'databaseName' in obj &&
      typeof obj.databaseName === 'string' &&
      'schemaName' in obj &&
      typeof obj.schemaName === 'string' &&
      'materializationName' in obj &&
      typeof obj.materializationName === 'string' &&
      'materializationType' in obj &&
      !!parseMaterializationType(obj.materializationType);
    if (alertData && !isAlertData(alertData))
      throw new Error('Incorrect alertData obj provided');

    if (
      typeof testSuiteId !== 'string' &&
      typeof executionId !== 'string' &&
      typeof targetResourceId !== 'string' &&
      typeof organizationId !== 'string'
    )
      throw new Error('Received invalid result values');

    return {
      executionId,
      testType,
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
  ): HandleQualTestExecutionResultAuthDto => {
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
        return HandleQualTestExecutionResultController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return HandleQualTestExecutionResultController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: HandleQualTestExecutionResultRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: HandleQualTestExecutionResultResponseDto =
        await this.#handleQualTestExecutionResult.execute(
          requestDto,
          authDto,
          this.#dbo
        );

      if (!useCaseResult.success) {
        return HandleQualTestExecutionResultController.badRequest(res);
      }

      return HandleQualTestExecutionResultController.ok(res, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return HandleQualTestExecutionResultController.fail(
        res,
        'handle test result - Internal error occurred'
      );
    }
  }
}
