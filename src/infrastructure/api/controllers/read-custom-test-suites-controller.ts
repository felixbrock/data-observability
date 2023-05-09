// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import {
  ReadCustomTestSuites,
  ReadCustomTestSuitesAuthDto,
  ReadCustomTestSuitesRequestDto,
  ReadCustomTestSuitesResponseDto,
} from '../../../domain/custom-test-suite/read-custom-test-suites';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import Result from '../../../domain/value-types/transient-types/result';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadCustomTestSuitesController extends BaseController {
  readonly #readCustomTestSuites: ReadCustomTestSuites;

  readonly #dbo: Dbo;

  constructor(
    readCustomTestSuites: ReadCustomTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readCustomTestSuites = readCustomTestSuites;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadCustomTestSuitesRequestDto => {
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
  ): ReadCustomTestSuitesAuthDto => ({
    jwt,
    isSystemInternal: userAccountInfo.isSystemInternal,
    callerOrgId: userAccountInfo.callerOrgId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadCustomTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadCustomTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadCustomTestSuitesRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadCustomTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );


      const useCaseResult: ReadCustomTestSuitesResponseDto =
        await this.#readCustomTestSuites.execute({
          req: requestDto,
          auth: authDto,
          dbConnection: this.#dbo.dbConnection,
        });

      

      if (!useCaseResult.success) {
        return ReadCustomTestSuitesController.badRequest(res);
      }

      const result = useCaseResult.value;
      if (!result)
        return ReadCustomTestSuitesController.fail(
          res,
          'Readin custom tests failed. Internal error.'
        );

      return ReadCustomTestSuitesController.ok(res, result, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadCustomTestSuitesController.fail(
        res,
        'read custom test suites - Unknown error occurred'
      );
    }
  }
}
