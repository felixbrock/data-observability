// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateTestHistoryEntry,
  UpdateTestHistoryEntryAuthDto,
  UpdateTestHistoryEntryRequestDto,
  UpdateTestHistoryEntryResponseDto,
} from '../../../domain/integration-api/snowflake/update-test-history-entry';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class UpdateTestHistoryEntryController extends BaseController {
  readonly #updateTestHistoryEntry: UpdateTestHistoryEntry;

  readonly #getAccounts: GetAccounts;

  constructor(updateTestHistoryEntry: UpdateTestHistoryEntry, getAccounts: GetAccounts) {
    super();
    this.#getAccounts = getAccounts;
    this.#updateTestHistoryEntry = updateTestHistoryEntry;
  }

  #buildRequestDto = (httpRequest: Request): UpdateTestHistoryEntryRequestDto => ({
    id: httpRequest.params.alertId,
    userFeedbackIsAnomaly: httpRequest.body.userFeedbackIsAnomaly,
  });

  #buildAuthDto = (jwt: string): UpdateTestHistoryEntryAuthDto => ({
    jwt
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateTestHistoryEntryController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateTestHistoryEntryController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateTestHistoryEntryController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateTestHistoryEntryRequestDto = this.#buildRequestDto(req);
      const authDto: UpdateTestHistoryEntryAuthDto = this.#buildAuthDto(
        jwt
      );

      const useCaseResult: UpdateTestHistoryEntryResponseDto =
        await this.#updateTestHistoryEntry.execute(
          requestDto,
          authDto,
        );


      if (!useCaseResult.success) {
        return UpdateTestHistoryEntryController.badRequest(res,);
      }

      const resultValue = useCaseResult.value;

      return UpdateTestHistoryEntryController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      return UpdateTestHistoryEntryController.fail(res, 'udpate test history - Unknown error occured');
    }
  }
}
