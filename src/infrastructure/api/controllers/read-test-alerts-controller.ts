import { Request, Response } from 'express';
import {
  ReadTestAlerts,
  ReadTestAlertsRequestDto,
  ReadTestAlertsResponseDto,
} from '../../../domain/front-end-data-structure/read-test-alerts';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadTestAlertsController extends BaseController {
  readonly #readTestAlerts: ReadTestAlerts;

  readonly #dbo: Dbo;

  constructor(
    readTestAlerts: ReadTestAlerts,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readTestAlerts = readTestAlerts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadTestAlertsRequestDto => {
    const { ids } = httpRequest.query;

    if (ids === undefined || typeof ids !== 'string') {
        throw new Error("Missing ids list");
    };

    const idsArray = JSON.parse(ids);

    return {
      ids: typeof idsArray === 'string' ? [idsArray] : idsArray,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadTestAlertsController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadTestAlertsController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new ReferenceError('Unauthorized - Caller organization id missing');

      const requestDto: ReadTestAlertsRequestDto = this.#buildRequestDto(req);


      const useCaseResult: ReadTestAlertsResponseDto =
        await this.#readTestAlerts.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection,
        });

      

      if (!useCaseResult.success) {
        return ReadTestAlertsController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return ReadTestAlertsController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadTestAlertsController.fail(
        res,
        'read test suite - Unknown error occurred'
      );
    }
  }
}