import { Request, Response } from 'express';
import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';
import { ReadTestSuite, ReadTestSuiteRequestDto, ReadTestSuiteResponseDto } from '../../../domain/test-suite/read-test-suite';

export default class ReadSelectedTestSuiteController extends BaseController {
  readonly #readTestSuite: ReadTestSuite;

  readonly #dbo: Dbo;

  constructor(
    readTestSuite: ReadTestSuite,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#readTestSuite = readTestSuite;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadTestSuiteRequestDto => {
    const { targetResourceId, activated } = httpRequest.query;

    if (targetResourceId === undefined || typeof targetResourceId !== 'string')
      throw new Error("Missing target resource id");
    
    if (activated === undefined || typeof activated !== 'string')
      throw new Error("Missing activated value");

    return {
      targetResourceId,
      activated: JSON.parse(activated)
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadSelectedTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return ReadSelectedTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.callerOrgId)
        throw new ReferenceError('Unauthorized - Caller organization id missing');

      const requestDto: ReadTestSuiteRequestDto = this.#buildRequestDto(req);

      const useCaseResult: ReadTestSuiteResponseDto =
        await this.#readTestSuite.execute({
          req: requestDto,
          auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
          dbConnection: this.#dbo.dbConnection
        });

      if (!useCaseResult.success) {
        return ReadSelectedTestSuiteController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return ReadSelectedTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return ReadSelectedTestSuiteController.fail(
        res,
        'read test suite - Unknown error occurred'
      );
    }
  }
}
