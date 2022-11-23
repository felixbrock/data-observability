// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateCustomTestSuite,
  UpdateCustomTestSuiteAuthDto,
  UpdateCustomTestSuiteRequestDto,
  UpdateCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/update-custom-test-suite';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  getAutomaticCronExpression,
  getFrequencyCronExpression,
  patchCronJob,
  patchTarget,
  updateCronJobState,
} from '../../../domain/services/cron-job';
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
      frequency,
      executionType: rawExecutionType,
      ...remainingBody
    } = httpRequest.body;
    const executionType = parseExecutionType(rawExecutionType);

    if (cron && executionType !== 'individual')
      throw new Error(
        `Cron value provided, but execution type is ${executionType}`
      );
    if (frequency && executionType !== 'frequency')
      throw new Error(
        `Frequency value provided, but execution type is ${executionType}`
      );

    return {
      id: httpRequest.params.id,
      props: {
        activated: remainingBody.activated,
        threshold: remainingBody.threshold,
        frequency,
        targetResourceIds: remainingBody.targetResourceIds,
        name: remainingBody.name,
        description: remainingBody.description,
        sqlLogic: remainingBody.sqlLogic,
        cron,
        executionType,
      },
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): UpdateCustomTestSuiteAuthDto => ({
    jwt,
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

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

      const requestDto: UpdateCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);

      if (!requestDto.props)
        return UpdateCustomTestSuiteController.ok(res, null, CodeHttp.OK);

      const authDto: UpdateCustomTestSuiteAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value,
        jwt
      );

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: UpdateCustomTestSuiteResponseDto =
        await this.#updateCustomTestSuite.execute(
          requestDto,
          authDto,
          connPool
        );

      if (!useCaseResult.success) {
        return UpdateCustomTestSuiteController.badRequest(res);
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        return UpdateCustomTestSuiteController.fail(
          res,
          'Update failed. Internal error.'
        );

      if (requestDto)
        if (
          requestDto.props.cron ||
          requestDto.props.frequency ||
          requestDto.props.executionType
        ) {
          let cron: string | undefined;
          if (requestDto.props.executionType === 'automatic')
            cron = getAutomaticCronExpression();
          else if (requestDto.props.cron) cron = requestDto.props.cron;
          else if (requestDto.props.frequency)
            cron = getFrequencyCronExpression(requestDto.props.frequency);

          await patchCronJob(requestDto.id, {
            cron,
          });

          if (requestDto.props.executionType)
            await patchTarget(requestDto.id, {
              executionType: requestDto.props.executionType,
            });
        }

      if (requestDto.props.activated !== undefined)
        await updateCronJobState(requestDto.id, requestDto.props.activated);

      await connPool.drain();
      await connPool.clear();

      return UpdateCustomTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return UpdateCustomTestSuiteController.fail(
        res,
        'update custom test suite - Unknown error occured'
      );
    }
  }
}
