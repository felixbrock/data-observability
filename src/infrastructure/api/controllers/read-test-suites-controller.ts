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
} from '../../shared/base-controller';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import Result from '../../../domain/value-types/transient-types/result';

export default class ReadTestSuitesController extends BaseController {
  readonly #readTestSuites: ReadTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(readTestSuites: ReadTestSuites, getAccounts: GetAccounts) {
    super();
    this.#readTestSuites = readTestSuites;
    this.#getAccounts = getAccounts;
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
    callerOrganizationId: userAccountInfo.callerOrganizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

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
        await this.#readTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return ReadTestSuitesController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.map((el) => el.toDto())
        : useCaseResult.value;

      return ReadTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return ReadTestSuitesController.fail(
        res,
        'read test suites - Unknown error occured'
      );
    }
  }
}
