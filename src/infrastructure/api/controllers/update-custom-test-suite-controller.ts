import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateCustomTestSuite,
  UpdateCustomTestSuiteRequestDto,
  UpdateCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/update-custom-test-suite';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import { parseExecutionType } from '../../../domain/value-types/execution-type';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Dbo from '../../persistence/db/mongo-db';

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
    const {
      cron,
      executionType: rawExecutionType,
      ...remainingBody
    } = httpRequest.body;
    const executionType = parseExecutionType(rawExecutionType);

    return {
      id: httpRequest.params.id,
      props: {
        activated: remainingBody.activated,
        customLowerThreshold: remainingBody.customLowerThreshold,
        customUpperThreshold: remainingBody.customUpperThreshold,
        targetResourceIds: remainingBody.targetResourceIds,
        name: remainingBody.name,
        description: remainingBody.description,
        sqlLogic: remainingBody.sqlLogic,
        cron,
        executionType,
        feedbackLowerThreshold: remainingBody.feedbackLowerThreshold,
        feedbackUpperThreshold: remainingBody.feedbackUpperThreshold,
        lastAlertSent: remainingBody.lastAlertSent,
      },
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
