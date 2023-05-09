// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import {
  ReadQualTestSuites,
  ReadQualTestSuitesAuthDto,
  ReadQualTestSuitesRequestDto,
  ReadQualTestSuitesResponseDto,
} from '../../../domain/qual-test-suite/read-qual-test-suites';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import Result from '../../../domain/value-types/transient-types/result';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

export default class ReadQualTestSuitesController extends BaseController {
  readonly #readQualTestSuites: ReadQualTestSuites;

  readonly #dbo: Dbo;

  constructor(
    readQualTestSuites: ReadQualTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readQualTestSuites = readQualTestSuites;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadQualTestSuitesRequestDto => {
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
  ): ReadQualTestSuitesAuthDto => ({
    jwt,
    isSystemInternal: userAccountInfo.isSystemInternal,
    callerOrgId: userAccountInfo.callerOrgId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadQualTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadQualTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadQualTestSuitesRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadQualTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value,
      );


      const useCaseResult: ReadQualTestSuitesResponseDto =
        await this.#readQualTestSuites.execute({
          req: requestDto,
          auth: authDto,
          dbConnection: this.#dbo.dbConnection,
        });

      

      if (!useCaseResult.success) {
        return ReadQualTestSuitesController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.map((element) => element.toDto())
        : useCaseResult.value;

      return ReadQualTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadQualTestSuitesController.fail(
        res,
        'read qual test suites - Unknown error occurred'
      );
    }
  }
}
