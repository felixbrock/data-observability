// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { buildNominalTestSuiteDto } from '../../../domain/nominal-test-suite/nominal-test-suite-dto';
import {
  ReadNominalTestSuite,
  ReadNominalTestSuiteAuthDto,
  ReadNominalTestSuiteRequestDto,
  ReadNominalTestSuiteResponseDto,
} from '../../../domain/nominal-test-suite/read-nominal-test-suite';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';

export default class ReadNominalTestSuiteController extends BaseController {
  readonly #readNominalTestSuite: ReadNominalTestSuite;

  readonly #getAccounts: GetAccounts;

  constructor(readNominalTestSuite: ReadNominalTestSuite, getAccounts: GetAccounts) {
    super();
    this.#getAccounts = getAccounts;
    this.#readNominalTestSuite = readNominalTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): ReadNominalTestSuiteRequestDto => {
    const { nominalTestSuiteId } = httpRequest.params;

    return {
      id: nominalTestSuiteId,
    };
  };

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): ReadNominalTestSuiteAuthDto => {
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
        return ReadNominalTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadNominalTestSuiteController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadNominalTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadNominalTestSuiteRequestDto = this.#buildRequestDto(req);
      const authDto: ReadNominalTestSuiteAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadNominalTestSuiteResponseDto =
        await this.#readNominalTestSuite.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return ReadNominalTestSuiteController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? buildNominalTestSuiteDto(useCaseResult.value)
        : useCaseResult.value;

      return ReadNominalTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      return ReadNominalTestSuiteController.fail(res, 'read nominal test suite - Unknown error occured');
    }
  }
}
