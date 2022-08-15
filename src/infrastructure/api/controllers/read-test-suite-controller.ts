// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { buildTestSuiteDto } from '../../../domain/test-suite/test-suite-dto';
import {
  ReadTestSuite,
  ReadTestSuiteAuthDto,
  ReadTestSuiteRequestDto,
  ReadTestSuiteResponseDto,
} from '../../../domain/test-suite/read-test-suite';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';

export default class ReadTestSuiteController extends BaseController {
  readonly #readTestSuite: ReadTestSuite;

  readonly #getAccounts: GetAccounts;

  constructor(readTestSuite: ReadTestSuite, getAccounts: GetAccounts) {
    super();
    this.#getAccounts = getAccounts;
    this.#readTestSuite = readTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): ReadTestSuiteRequestDto => {
    const { testSuiteId } = httpRequest.params;

    return {
      id: testSuiteId,
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadTestSuiteAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized');

    return {
      jwt,
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadTestSuiteController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadTestSuiteRequestDto = this.#buildRequestDto(req);
      const authDto: ReadTestSuiteAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadTestSuiteResponseDto =
        await this.#readTestSuite.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return ReadTestSuiteController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? buildTestSuiteDto(useCaseResult.value)
        : useCaseResult.value;

      return ReadTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return ReadTestSuiteController.fail(res, error);
      if (error instanceof Error)
        return ReadTestSuiteController.fail(res, error);
      return ReadTestSuiteController.fail(res, 'Unknown error occured');
    }
  }
}
