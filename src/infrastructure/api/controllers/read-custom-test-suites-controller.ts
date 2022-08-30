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
} from '../../shared/base-controller';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import Result from '../../../domain/value-types/transient-types/result';

export default class ReadCustomTestSuitesController extends BaseController {
  readonly #readCustomTestSuites: ReadCustomTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(readCustomTestSuites: ReadCustomTestSuites, getAccounts: GetAccounts) {
    super();
    this.#readCustomTestSuites = readCustomTestSuites;
    this.#getAccounts = getAccounts;
  }

  #buildRequestDto = (httpRequest: Request): ReadCustomTestSuitesRequestDto => {
    const { executionFrequency, activated } = httpRequest.query;

    if (
      activated &&
      typeof activated === 'string' &&
      !['true', 'false'].includes(activated)
    )
      throw new TypeError(
        "activated query parameter must either be 'true' or 'false'"
      );

    return {
      activated: activated === 'true',
      executionFrequency: Number(executionFrequency),
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadCustomTestSuitesAuthDto => ({
    jwt,
    isSystemInternal: userAccountInfo.isSystemInternal,
    callerOrganizationId: userAccountInfo.callerOrganizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadCustomTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadCustomTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadCustomTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadCustomTestSuitesRequestDto = this.#buildRequestDto(req);
      const authDto: ReadCustomTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadCustomTestSuitesResponseDto =
        await this.#readCustomTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return ReadCustomTestSuitesController.badRequest(res, useCaseResult.error);
      }

      return ReadCustomTestSuitesController.ok(res, useCaseResult.value, CodeHttp.OK);
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return ReadCustomTestSuitesController.fail(res, error);
      if (error instanceof Error)
        return ReadCustomTestSuitesController.fail(res, error);
      return ReadCustomTestSuitesController.fail(res, 'Unknown error occured');
    }
  }
}
