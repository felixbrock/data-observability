// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import {
  ReadCustomTestSuite,
  ReadCustomTestSuiteAuthDto,
  ReadCustomTestSuiteRequestDto,
  ReadCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/read-custom-test-suite';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';

export default class ReadCustomTestSuiteController extends BaseController {
  readonly #readCustomTestSuite: ReadCustomTestSuite;

  readonly #getAccounts: GetAccounts;

  constructor(
    readCustomTestSuite: ReadCustomTestSuite,
    getAccounts: GetAccounts
  ) {
    super();
    this.#getAccounts = getAccounts;
    this.#readCustomTestSuite = readCustomTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): ReadCustomTestSuiteRequestDto => {
    const { id } = httpRequest.params;

    return {
      id,
      targetOrgId: httpRequest.body.targetOrgId
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadCustomTestSuiteAuthDto => ({
      jwt,
      callerOrgId: userAccountInfo.callerOrgId,
      isSystemInternal: userAccountInfo.isSystemInternal,
    });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadCustomTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadCustomTestSuiteController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadCustomTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadCustomTestSuiteAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadCustomTestSuiteResponseDto =
        await this.#readCustomTestSuite.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return ReadCustomTestSuiteController.badRequest(res);
      }

      const result = useCaseResult.value;
      if (!result)
        return ReadCustomTestSuiteController.notFound(
          res,
          'Custom test suite not created. Internal error.'
        );

      return ReadCustomTestSuiteController.ok(res, result, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return ReadCustomTestSuiteController.fail(
        res,
        'read custom test suite - Unknown error occured'
      );
    }
  }
}
