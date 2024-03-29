// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import {
  ReadTestSuites,
  ReadTestSuitesAuthDto,
  ReadTestSuitesRequestDto,
  ReadTestSuitesResponseDto,
} from '../../../domain/test-suite/read-test-suites';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import Result from '../../../domain/value-types/transient-types/result';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadTestSuitesController extends BaseController {
  readonly #readTestSuites: ReadTestSuites;

  readonly #dbo: Dbo;

  constructor(
    readTestSuites: ReadTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readTestSuites = readTestSuites;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadTestSuitesRequestDto => {
    const { activated } = httpRequest.query;

    if (
      activated &&
      typeof activated === 'string' &&
      !['true', 'false'].includes(activated)
    )
      throw new TypeError(
        "activated query parameter must either be 'true' or 'false'"
      );

    return {
      activated: activated ? activated === 'true' : undefined,
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadTestSuitesAuthDto => ({
    jwt,
    isSystemInternal: userAccountInfo.isSystemInternal,
    callerOrgId: userAccountInfo.callerOrgId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadTestSuitesRequestDto = this.#buildRequestDto(req);
      const authDto: ReadTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );


      const useCaseResult: ReadTestSuitesResponseDto =
        await this.#readTestSuites.execute({
          req: requestDto,
          auth: authDto,
          dbConnection: this.#dbo.dbConnection,
        });

      

      if (!useCaseResult.success) {
        return ReadTestSuitesController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.map((el) => el.toDto())
        : useCaseResult.value;

      return ReadTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadTestSuitesController.fail(
        res,
        'read test suites - Unknown error occurred'
      );
    }
  }
}
