import { Request, Response } from 'express';
import {
  ReadTestHistory,
  ReadTestHistoryRequestDto,
  ReadTestHistoryResponseDto,
} from '../../../domain/custom-query/read-test-history';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadTestHistoryController extends BaseController {
  readonly #readTestHistory: ReadTestHistory;

  readonly #dbo: Dbo;

  constructor(
    readTestHistory: ReadTestHistory,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readTestHistory = readTestHistory;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadTestHistoryRequestDto => {
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
        return ReadTestHistoryController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadTestHistoryController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new ReferenceError(
          'Unauthorized - Caller organization id missing'
        );

      const requestDto: ReadTestHistoryRequestDto = this.#buildRequestDto(req);

      const useCaseResult: ReadTestHistoryResponseDto =
        await this.#readTestHistory.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection,
        });

      if (!useCaseResult.success) {
        return ReadTestHistoryController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return ReadTestHistoryController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadTestHistoryController.fail(
        res,
        'read test history - Unknown error occurred'
      );
    }
  }
}
