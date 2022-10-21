// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateCustomTestSuite,
  UpdateCustomTestSuiteAuthDto,
  UpdateCustomTestSuiteRequestDto,
  UpdateCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/update-custom-test-suite';
import {
  getFrequencyCronExpression,
  patchCronJob,
} from '../../../domain/services/cron-job';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class UpdateCustomTestSuiteController extends BaseController {
  readonly #updateCustomTestSuite: UpdateCustomTestSuite;

  readonly #getAccounts: GetAccounts;

  constructor(
    updateCustomTestSuite: UpdateCustomTestSuite,
    getAccounts: GetAccounts
  ) {
    super();
    this.#getAccounts = getAccounts;
    this.#updateCustomTestSuite = updateCustomTestSuite;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateCustomTestSuiteRequestDto => ({
    id: httpRequest.params.customTestSuiteId,
    activated: httpRequest.body.activated,
    threshold: httpRequest.body.threshold,
    frequency: httpRequest.body.frequency,
    targetResourceIds: httpRequest.body.targetResourceIds,
    name: httpRequest.body.name,
    description: httpRequest.body.description,
    sqlLogic: httpRequest.body.sqlLogic,
    cron: httpRequest.body.cron,
  });

  #buildAuthDto = (jwt: string): UpdateCustomTestSuiteAuthDto => ({
    jwt,
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
        await UpdateCustomTestSuiteController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateCustomTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateCustomTestSuiteAuthDto = this.#buildAuthDto(jwt);

      const useCaseResult: UpdateCustomTestSuiteResponseDto =
        await this.#updateCustomTestSuite.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return UpdateCustomTestSuiteController.badRequest(res);
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        return UpdateCustomTestSuiteController.fail(
          res,
          'Update failed. Internal error.'
        );

      if (
        requestDto.cron ||
        requestDto.frequency ||
        requestDto.activated !== undefined
      ) {
        let cron: string | undefined;
        if (requestDto.cron) cron = requestDto.cron;
        else if (requestDto.frequency)
          cron = getFrequencyCronExpression(requestDto.frequency);

        await patchCronJob(requestDto.id, {
          cron,
          toBeActivated: requestDto.activated,
        });
      }

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
