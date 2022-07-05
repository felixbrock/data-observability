// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { buildTestSuiteDto } from '../../../domain/test-suite/test-suite-dto';
import {
  ReadTestSuites,
  ReadTestSuitesAuthDto,
  ReadTestSuitesRequestDto,
  ReadTestSuitesResponseDto,
} from '../../../domain/test-suite/read-test-suites';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class ReadTestSuitesController extends BaseController {
  readonly #readTestSuites: ReadTestSuites;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    readTestSuites: ReadTestSuites,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#readTestSuites = readTestSuites;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadTestSuitesRequestDto => {
    const { targetId, activated } = httpRequest.query;

    if (
      activated &&
      typeof activated === 'string' &&
      !['true', 'false'].includes(activated)
    )
      throw new TypeError(
        "activated query parameter must either be 'true' or 'false'"
      );

    return {
      targetId: typeof targetId === 'string' ? targetId : undefined,
      activated: activated === 'true',
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): ReadTestSuitesAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return ReadTestSuitesController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await ReadTestSuitesInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return ReadTestSuitesInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: ReadTestSuitesRequestDto = this.#buildRequestDto(req);
      // const authDto: ReadTestSuitesAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const useCaseResult: ReadTestSuitesResponseDto =
        await this.#readTestSuites.execute(
          requestDto,
          {
            organizationId: 'todo',
          },
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return ReadTestSuitesController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.map((element) => buildTestSuiteDto(element))
        : useCaseResult.value;

      return ReadTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return ReadTestSuitesController.fail(res, error);
      if (error instanceof Error)
        return ReadTestSuitesController.fail(res, error);
      return ReadTestSuitesController.fail(res, 'Unknown error occured');
    }
  }
}
