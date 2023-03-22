import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
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

export default class UpdateCustomTestSuiteController extends BaseController {
  readonly #updateCustomTestSuite: UpdateCustomTestSuite;

  constructor(
    updateCustomTestSuite: UpdateCustomTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#updateCustomTestSuite = updateCustomTestSuite;
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

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: UpdateCustomTestSuiteResponseDto =
        await this.#updateCustomTestSuite.execute({
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          req: requestDto,
          connPool,
        });

      await connPool.drain();
      await connPool.clear();

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
