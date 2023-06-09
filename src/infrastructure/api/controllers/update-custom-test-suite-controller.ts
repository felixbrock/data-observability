import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateCustomTestSuite,
  UpdateCustomTestSuiteRequestDto,
  UpdateCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/update-custom-test-suite';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Dbo from '../../persistence/db/mongo-db';
import { parseExecutionType } from '../../../domain/value-types/execution-type';

export default class UpdateCustomTestSuiteController extends BaseController {
  readonly #updateCustomTestSuite: UpdateCustomTestSuite;

  readonly #dbo: Dbo;

  constructor(
    updateCustomTestSuite: UpdateCustomTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#updateCustomTestSuite = updateCustomTestSuite;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateCustomTestSuiteRequestDto => {
    if (httpRequest.body.executionType) {
      parseExecutionType(httpRequest.body.executionType);
    }

    return {
      id: httpRequest.params.id,
      props: httpRequest.body
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateCustomTestSuiteController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return UpdateCustomTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new Error('Unauthorized');

      const requestDto: UpdateCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);

      if (!requestDto.props)
        return UpdateCustomTestSuiteController.ok(res, null, CodeHttp.OK);


      const useCaseResult: UpdateCustomTestSuiteResponseDto =
        await this.#updateCustomTestSuite.execute({
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          req: requestDto,
          dbConnection: this.#dbo.dbConnection,
        });

      

      if (!useCaseResult.success) {
        return UpdateCustomTestSuiteController.badRequest(res);
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        return UpdateCustomTestSuiteController.fail(
          res,
          'Update failed. Internal error.'
        );

      return UpdateCustomTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return UpdateCustomTestSuiteController.fail(
        res,
        'update custom test suite - Unknown error occurred'
      );
    }
  }
}
