import { Request, Response } from 'express';
import {
  ReadAlertHistory,
  ReadAlertHistoryRequestDto,
  ReadAlertHistoryResponseDto,
} from '../../../domain/custom-query/read-alert-history';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadAlertHistoryController extends BaseController {
  readonly #readAlertHistory: ReadAlertHistory;

  readonly #dbo: Dbo;

  constructor(
    readAlertHistory: ReadAlertHistory,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readAlertHistory = readAlertHistory;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadAlertHistoryRequestDto => {
    const { ids } = httpRequest.query;

    if (ids === undefined || typeof ids !== 'string') {
      throw new Error('Missing ids list');
    }

    const idsArray = JSON.parse(ids);

    return {
      testSuiteIds: typeof idsArray === 'string' ? [idsArray] : idsArray,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadAlertHistoryController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadAlertHistoryController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new ReferenceError(
          'Unauthorized - Caller organization id missing'
        );

      const requestDto: ReadAlertHistoryRequestDto = this.#buildRequestDto(req);

      const useCaseResult: ReadAlertHistoryResponseDto =
        await this.#readAlertHistory.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection,
        });

      if (!useCaseResult.success) {
        return ReadAlertHistoryController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return ReadAlertHistoryController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadAlertHistoryController.fail(
        res,
        'read alert history - Unknown error occurred'
      );
    }
  }
}
