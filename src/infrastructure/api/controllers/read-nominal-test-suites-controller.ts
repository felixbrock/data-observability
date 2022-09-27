// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { buildNominalTestSuiteDto } from '../../../domain/nominal-test-suite/nominal-test-suite-dto';
import {
  ReadNominalTestSuites,
  ReadNominalTestSuitesAuthDto,
  ReadNominalTestSuitesRequestDto,
  ReadNominalTestSuitesResponseDto,
} from '../../../domain/nominal-test-suite/read-nominal-test-suites';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import Result from '../../../domain/value-types/transient-types/result';

export default class ReadNominalTestSuitesController extends BaseController {
  readonly #readNominalTestSuites: ReadNominalTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(readNominalTestSuites: ReadNominalTestSuites, getAccounts: GetAccounts) {
    super();
    this.#readNominalTestSuites = readNominalTestSuites;
    this.#getAccounts = getAccounts;
  }

  #buildRequestDto = (httpRequest: Request): ReadNominalTestSuitesRequestDto => {
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
  ): ReadNominalTestSuitesAuthDto => ({
    jwt,
    isSystemInternal: userAccountInfo.isSystemInternal,
    callerOrganizationId: userAccountInfo.callerOrganizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadNominalTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadNominalTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadNominalTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadNominalTestSuitesRequestDto = this.#buildRequestDto(req);
      const authDto: ReadNominalTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadNominalTestSuitesResponseDto =
        await this.#readNominalTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return ReadNominalTestSuitesController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.map((element) => buildNominalTestSuiteDto(element))
        : useCaseResult.value;

      return ReadNominalTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return ReadNominalTestSuitesController.fail(res, error);
      if (error instanceof Error)
        return ReadNominalTestSuitesController.fail(res, error);
      return ReadNominalTestSuitesController.fail(res, 'Unknown error occured');
    }
  }
}