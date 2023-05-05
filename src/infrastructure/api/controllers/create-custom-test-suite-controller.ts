// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateCustomTestSuite,
  CreateCustomTestSuiteAuthDto,
  CreateCustomTestSuiteRequestDto,
  CreateCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/create-custom-test-suite';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Dbo from '../../persistence/db/mongo-db';

export default class CreateCustomTestSuiteController extends BaseController {
  readonly #createCustomTestSuite: CreateCustomTestSuite;

  readonly #dbo: Dbo;

  constructor(
    createCustomTestSuite: CreateCustomTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#createCustomTestSuite = createCustomTestSuite;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): CreateCustomTestSuiteRequestDto => ({
    entityProps: {
      activated: httpRequest.body.activated,
      name: httpRequest.body.name,
      description: httpRequest.body.description,
      sqlLogic: httpRequest.body.sqlLogic,
      targetResourceIds: JSON.parse(httpRequest.body.targetResourceIds),
      cron: httpRequest.body.cron,
      executionType: httpRequest.body.executionType,
    },
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): CreateCustomTestSuiteAuthDto => {
    if (!userAccountInfo.callerOrgId) throw new Error('Unauthorized');

    return { callerOrgId: userAccountInfo.callerOrgId };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateCustomTestSuiteController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return CreateCustomTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);

      const auth = this.#buildAuthDto(getUserAccountInfoResult.value);


      const useCaseResult: CreateCustomTestSuiteResponseDto =
        await this.#createCustomTestSuite.execute({
          auth,
          req: requestDto,
          dbConnection: this.#dbo.dbConnection,
        });



      if (!useCaseResult.success) {
        return CreateCustomTestSuiteController.badRequest(res);
      }

      const result = useCaseResult.value;
      if (!result)
        return CreateCustomTestSuiteController.fail(
          res,
          'Custom test suite not created. Internal error.'
        );

      return CreateCustomTestSuiteController.ok(
        res,
        result.toDto(),
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return CreateCustomTestSuiteController.fail(
        res,
        'create custom test suite - unknown error occurred'
      );
    }
  }
}
