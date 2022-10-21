// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerNominalTestSuiteExecution,
  TriggerNominalTestSuiteExecutionAuthDto,
  TriggerNominalTestSuiteExecutionRequestDto,
  TriggerNominalTestSuiteExecutionResponseDto,
} from '../../../domain/nominal-test-suite/trigger-nominal-test-suite-execution';
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
  ): TriggerNominalTestSuiteExecutionRequestDto => ({
    id: httpRequest.body.id,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerNominalTestSuiteExecutionAuthDto => {
    if (!userAccountInfo.callerOrganizationId)
      throw new Error('tigger-test-execution - callerOrganizationId missing');

    return {
      jwt,
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

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

      const requestDto: TriggerNominalTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerNominalTestSuiteExecutionResponseDto =
        await this.#triggerNominalTestSuiteExecution.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return TriggerNominalTestSuiteExecutionController.badRequest(
          res,
        );
      }

      return TriggerNominalTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return TriggerNominalTestSuiteExecutionController.fail(
        res,
        'trigger nominal test suite - Unknown error occured'
      );
    }
  }
}
