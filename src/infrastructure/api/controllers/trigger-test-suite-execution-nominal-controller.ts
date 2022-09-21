// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerNominalTestSuiteExecution,
  TriggerNominalTestSuiteExecutionAuthDto,
  TriggerNominalTestSuiteExecutionRequestDto,
  TriggerNominalTestSuiteExecutionResponseDto,
} from '../../../domain/nominal-test-suite/trigger-nominal-test-suite-execution';
import { buildNominalTestSuiteDto } from '../../../domain/nominal-test-suite/nominal-test-suite-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class TriggerNominalTestSuiteExecutionController extends BaseController {
  readonly #triggerNominalTestSuiteExecution: TriggerNominalTestSuiteExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerNominalTestSuiteExecution: TriggerNominalTestSuiteExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerNominalTestSuiteExecution = triggerNominalTestSuiteExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerNominalTestSuiteExecutionRequestDto => {
    if (Number.isNaN(httpRequest.body.frequency))
      throw new Error('Provided frequency not in the right format');

    return { frequency: httpRequest.body.frequency };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerNominalTestSuiteExecutionAuthDto => ({
      isSystemInternal: userAccountInfo.isSystemInternal,
      jwt,
    });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerNominalTestSuiteExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await TriggerNominalTestSuiteExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return TriggerNominalTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if(!getUserAccountInfoResult.value.isSystemInternal) return TriggerNominalTestSuiteExecutionController.unauthorized(res, 'Unauthorized');

      const requestDto: TriggerNominalTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerNominalTestSuiteExecutionResponseDto =
        await this.#triggerNominalTestSuiteExecution.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return TriggerNominalTestSuiteExecutionController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value
        ? buildNominalTestSuiteDto(useCaseResult.value)
        : useCaseResult.value;

      return TriggerNominalTestSuiteExecutionController.ok(
        res,
        resultValue,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return TriggerNominalTestSuiteExecutionController.fail(res, error);
      if (error instanceof Error)
        return TriggerNominalTestSuiteExecutionController.fail(res, error);
      return TriggerNominalTestSuiteExecutionController.fail(
        res,
        'Unknown error occured'
      );
    }
  }
}
