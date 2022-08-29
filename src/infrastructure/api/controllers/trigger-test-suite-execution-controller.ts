// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerTestSuiteExecution,
  TriggerTestSuiteExecutionAuthDto,
  TriggerTestSuiteExecutionRequestDto,
  TriggerTestSuiteExecutionResponseDto,
} from '../../../domain/test-suite/trigger-test-suite-execution';
import { buildTestSuiteDto } from '../../../domain/test-suite/test-suite-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class TriggerTestSuiteExecutionController extends BaseController {
  readonly #triggerTestSuiteExecution: TriggerTestSuiteExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerTestSuiteExecution: TriggerTestSuiteExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerTestSuiteExecution = triggerTestSuiteExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerTestSuiteExecutionRequestDto => {
    if (Number.isNaN(httpRequest.body.frequency))
      throw new Error('Provided frequency not in the right format');

    return { frequency: httpRequest.body.frequency };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerTestSuiteExecutionAuthDto => ({
      isSystemInternal: userAccountInfo.isSystemInternal,
      jwt,
    });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerTestSuiteExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await TriggerTestSuiteExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return TriggerTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if(!getUserAccountInfoResult.value.isSystemInternal) return TriggerTestSuiteExecutionController.unauthorized(res, 'Unauthorized');

      const requestDto: TriggerTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerTestSuiteExecutionResponseDto =
        await this.#triggerTestSuiteExecution.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return TriggerTestSuiteExecutionController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value
        ? buildTestSuiteDto(useCaseResult.value)
        : useCaseResult.value;

      return TriggerTestSuiteExecutionController.ok(
        res,
        resultValue,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return TriggerTestSuiteExecutionController.fail(res, error);
      if (error instanceof Error)
        return TriggerTestSuiteExecutionController.fail(res, error);
      return TriggerTestSuiteExecutionController.fail(
        res,
        'Unknown error occured'
      );
    }
  }
}
