// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { appConfig } from '../../../config';
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
import {
  QualTestAlertData,
  QualTestTestData,
  SchemaDiff,
} from '../../../domain/test-execution-api/qual-test-execution-result-dto';
import { parseMaterializationType } from '../../../domain/value-types/materialization-type';
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

  #isObj = (obj: unknown): obj is { [key: string]: unknown } =>
    !!obj &&
    typeof obj === 'object' &&
    Object.keys(obj).every((el) => typeof el === 'string');

  #isSchemaDiff = (obj: unknown): obj is SchemaDiff =>
    !!obj &&
    typeof obj === 'object' &&
    'column_name' in obj &&
    'ordinal_position' in obj;

  #isTestData = (obj: unknown): obj is QualTestTestData => {
    if (!this.#isObj(obj)) return false;

    const { executedOn, isIdentical, deviations } = obj;

    if (
      !deviations ||
      typeof deviations !== 'object' ||
      (deviations.constructor.name !== 'Array' &&
        (deviations as unknown[]).some((el) => !this.#isSchemaDiff(el)))
    )
      throw new Error('Received incorrect schemadiff deviation objs');

    if (
      !executedOn ||
      typeof executedOn !== 'string' ||
      typeof isIdentical !== 'boolean'
    )
      return false;

    return true;
  };

  #isAlertData = (obj: unknown): obj is QualTestAlertData => {
    if (!this.#isObj(obj)) return false;

    const {
      alertId,
      message,
      databaseName,
      schemaName,
      materializationName,
      materializationType,
    } = obj;

    parseMaterializationType(materializationType);

    if (
      !alertId ||
      typeof alertId !== 'string' ||
      !message ||
      typeof message !== 'string' ||
      !databaseName ||
      typeof databaseName !== 'string' ||
      !schemaName ||
      typeof schemaName !== 'string' ||
      !materializationName ||
      typeof materializationName !== 'string' ||
      !materializationType
    )
      return false;

    return true;
  };

  #buildRequestDto = (
    httpRequest: Request
  ): HandleQualTestExecutionResultRequestDto => {
    const { id: testSuiteId } = httpRequest.params;

    const {
      executionId,
      testData,
      alertData,
      targetResourceId,
      organizationId,
      lastAlertSent,
    } = httpRequest.body;

    const testType: QualTestType = parseQualTestType(httpRequest.body.testType);

    if (!this.#isTestData(testData))
      throw new Error('Incorrect testData obj provided');

    if (alertData && !this.#isAlertData(alertData))
      throw new Error('Incorrect alertData obj provided');

    if (
      typeof executionId !== 'string' &&
      typeof targetResourceId !== 'string' &&
      typeof organizationId !== 'string' &&
      typeof lastAlertSent !== 'string'
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
      lastAlertSent,
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): HandleQualTestExecutionResultAuthDto => {
    if (!userAccountInfo.isSystemInternal)
      throw new Error('Unauthorized - External Call');

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

      console.log(
        `Running in ${appConfig.express.mode}: Handling execution result for qual test-suite ${requestDto.testSuiteId} of org ${requestDto.organizationId}`
      );


      const useCaseResult: HandleQualTestExecutionResultResponseDto =
        await this.#handleQualTestExecutionResult.execute({
          req: requestDto,
          auth: authDto,
          dbConnection: this.#dbo.dbConnection
        });
      
      

      if (!useCaseResult.success) {
        return HandleQualTestExecutionResultController.badRequest(res);
      }

      return HandleQualTestExecutionResultController.ok(
        res,
        undefined,
        CodeHttp.CREATED
      );
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
