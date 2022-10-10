// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerNominalTestSuitesExecution,
  TriggerNominalTestSuitesExecutionAuthDto,
  TriggerNominalTestSuitesExecutionRequestDto,
  TriggerNominalTestSuitesExecutionResponseDto,
} from '../../../domain/nominal-test-suite/trigger-nominal-test-suites-execution';
import { buildNominalTestSuiteDto } from '../../../domain/nominal-test-suite/nominal-test-suite-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class TriggerNominalTestSuitesExecutionController extends BaseController {
  readonly #triggerNominalTestSuitesExecution: TriggerNominalTestSuitesExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerNominalTestSuitesExecution: TriggerNominalTestSuitesExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerNominalTestSuitesExecution = triggerNominalTestSuitesExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerNominalTestSuitesExecutionRequestDto => {
    if (Number.isNaN(httpRequest.body.frequency))
      throw new Error('Provided frequency not in the right format');

    return { frequency: httpRequest.body.frequency };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerNominalTestSuitesExecutionAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
    jwt,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerNominalTestSuitesExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await TriggerNominalTestSuitesExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return TriggerNominalTestSuitesExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return TriggerNominalTestSuitesExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const requestDto: TriggerNominalTestSuitesExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerNominalTestSuitesExecutionResponseDto =
        await this.#triggerNominalTestSuitesExecution.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return TriggerNominalTestSuitesExecutionController.badRequest(
          res,
        );
      }

      const resultValue = useCaseResult.value
        ? buildNominalTestSuiteDto(useCaseResult.value)
        : useCaseResult.value;

      return TriggerNominalTestSuitesExecutionController.ok(
        res,
        resultValue,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      return TriggerNominalTestSuitesExecutionController.fail(
        res,
        'trigger nominal test suites - Unknown error occured'
      );
    }
  }
}
