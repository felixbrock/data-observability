// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  createCronJob,
  getFrequencyCronExpression,
} from '../../../domain/services/cron-job';

import {
  CreateTestSuites,
  CreateTestSuitesAuthDto,
  CreateTestSuitesRequestDto,
  CreateTestSuitesResponseDto,
} from '../../../domain/test-suite/create-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateTestSuitesController extends BaseController {
  readonly #createTestSuites: CreateTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(createTestSuites: CreateTestSuites, getAccounts: GetAccounts) {
    super();
    this.#createTestSuites = createTestSuites;
    this.#getAccounts = getAccounts;
  }

  #buildRequestDto = (httpRequest: Request): CreateTestSuitesRequestDto => ({
    createObjects: httpRequest.body.createObjects,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): CreateTestSuitesAuthDto => {
    if (!userAccountInfo.callerOrganizationId)
      throw new Error('Unauthorized - Caller organization id missing');

    return {
      callerOrganizationId: userAccountInfo.callerOrganizationId,
      jwt,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateTestSuitesController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateTestSuitesRequestDto = this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: CreateTestSuitesResponseDto =
        await this.#createTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return CreateTestSuitesController.badRequest(res);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test suite result value');

      const resultValues = useCaseResult.value.map((el) => el.toDto());

      await Promise.all(
        resultValues.map(async (el) => {
          await createCronJob(
            el.id,
            getFrequencyCronExpression(el.executionFrequency),
            authDto.callerOrganizationId
          );
        })
      );

      return CreateTestSuitesController.ok(res, resultValues, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return CreateTestSuitesController.fail(
        res,
        'create test suites - Internal error occured'
      );
    }
  }
}
