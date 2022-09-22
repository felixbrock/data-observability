// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateNominalTestSuites,
  CreateNominalTestSuitesAuthDto,
  CreateNominalTestSuitesRequestDto,
  CreateNominalTestSuitesResponseDto,
} from '../../../domain/nominal-test-suite/create-nominal-test-suites';
import { buildNominalTestSuiteDto } from '../../../domain/nominal-test-suite/nominal-test-suite-dto';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateNominalTestSuitesController extends BaseController {
  readonly #createNominalTestSuites: CreateNominalTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(createNominalTestSuites: CreateNominalTestSuites, getAccounts: GetAccounts) {
    super();
    this.#createNominalTestSuites = createNominalTestSuites;
    this.#getAccounts = getAccounts;
  }

  #buildRequestDto = (httpRequest: Request): CreateNominalTestSuitesRequestDto => ({
    createObjects: httpRequest.body.createObjects,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): CreateNominalTestSuitesAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized - Caller organization id missing');

    return {
      callerOrganizationId: userAccountInfo.callerOrganizationId,
      jwt,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateNominalTestSuitesController.unauthorized(res, 'Unauthorized - auth-header missing');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateNominalTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateNominalTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateNominalTestSuitesRequestDto = this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: CreateNominalTestSuitesResponseDto =
        await this.#createNominalTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return CreateNominalTestSuitesController.badRequest(res, useCaseResult.error);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test suite result value');

      const resultValue = useCaseResult.value.map((el) =>
        buildNominalTestSuiteDto(el)
      );

      return CreateNominalTestSuitesController.ok(res, resultValue, CodeHttp.CREATED);
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return CreateNominalTestSuitesController.fail(res, error);
      if (error instanceof Error)
        return CreateNominalTestSuitesController.fail(res, error);
      return CreateNominalTestSuitesController.fail(res, 'Unknown error occured');
    }
  }
}
