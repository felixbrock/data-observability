// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateNominalTestSuites,
  CreateNominalTestSuitesAuthDto,
  CreateNominalTestSuitesRequestDto,
  CreateNominalTestSuitesResponseDto,
} from '../../../domain/nominal-test-suite/create-nominal-test-suites';
import { createCronJob, getFrequencyCronExpression } from '../../../domain/services/cron-job';
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
        return CreateNominalTestSuitesController.badRequest(res);
      }

      if (!useCaseResult.value)
        throw new Error('Missing create test suite result value');

      const resultValues = useCaseResult.value.map((el) =>
        el.toDto()
      );

      await Promise.all(
        resultValues.map(async (el) => {
          await createCronJob(
            el.id,
            getFrequencyCronExpression(el.executionFrequency),
            authDto.callerOrganizationId
          );
        })
      );

      return CreateNominalTestSuitesController.ok(res, resultValues, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return CreateNominalTestSuitesController.fail(res, 'create nominal test suites - Unknown error occured');
    }
  }
}
