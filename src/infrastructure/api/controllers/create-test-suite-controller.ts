// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateTestSuite,
  CreateTestSuiteAuthDto,
  CreateTestSuiteRequestDto,
  CreateTestSuiteResponseDto,
} from '../../../domain/test-suite/create-test-suite';
import { buildTestSuiteDto } from '../../../domain/test-suite/test-suite-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateTestSuiteController extends BaseController {
  readonly #createTestSuite: CreateTestSuite;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    createTestSuite: CreateTestSuite,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#createTestSuite = createTestSuite;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): CreateTestSuiteRequestDto => ({
    activated: httpRequest.body.activated,
    type: httpRequest.body.type,
    threshold: httpRequest.body.threshold,
    executionFrequency: httpRequest.body.executionFrequency,
    databaseName: httpRequest.body.databaseName,
    schemaName: httpRequest.body.schemaName,
    materializationName: httpRequest.body.materializationName,
    materializationType: httpRequest.body.materializationType,
    columnName: httpRequest.body.columnName,
    targetResourceId: httpRequest.body.targetResourceId,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): CreateTestSuiteAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized');

    return {
      organizationId: userAccountInfo.callerOrganizationId,
      jwt,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateTestSuiteController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateTestSuiteRequestDto = this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: CreateTestSuiteResponseDto =
        await this.#createTestSuite.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return CreateTestSuiteController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? buildTestSuiteDto(useCaseResult.value)
        : useCaseResult.value;

      return CreateTestSuiteController.ok(res, resultValue, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return CreateTestSuiteController.fail(res, error);
      if (error instanceof Error)
        return CreateTestSuiteController.fail(res, error);
      return CreateTestSuiteController.fail(res, 'Unknown error occured');
    }
  }
}
