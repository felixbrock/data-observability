// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { appConfig } from '../../../config';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateNominalTestSuites,
  UpdateNominalTestSuitesAuthDto,
  UpdateNominalTestSuitesRequestDto,
  UpdateNominalTestSuitesResponseDto,
} from '../../../domain/nominal-test-suite/update-nominal-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import { putCronJob } from './util';

export default class UpdateNominalTestSuitesController extends BaseController {
  readonly #updateNominalTestSuites: UpdateNominalTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(
    updateNominalTestSuites: UpdateNominalTestSuites,
    getAccounts: GetAccounts
  ) {
    super();
    this.#getAccounts = getAccounts;
    this.#updateNominalTestSuites = updateNominalTestSuites;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateNominalTestSuitesRequestDto => ({
    updateObjects: httpRequest.body.updateObjects,
  });

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): UpdateNominalTestSuitesAuthDto => {
    if (!userAccountInfo.callerOrganizationId)
      throw new Error('callerOrganizationId missing');
    return {
      jwt,
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateNominalTestSuitesController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateNominalTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateNominalTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateNominalTestSuitesRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateNominalTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: UpdateNominalTestSuitesResponseDto =
        await this.#updateNominalTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return UpdateNominalTestSuitesController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        UpdateNominalTestSuitesController.fail(
          res,
          'Update of test suites failed. Internal error.'
        );

      if (appConfig.express.mode !== 'production')
        return UpdateNominalTestSuitesController.ok(
          res,
          resultValue,
          CodeHttp.OK
        );

      await Promise.all(
        requestDto.updateObjects.map(async (obj) => {
          if (obj.cron || obj.activated !== undefined)
            await putCronJob(obj.id, obj.cron, obj.activated);
        })
      );

      return UpdateNominalTestSuitesController.ok(
        res,
        resultValue,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      return UpdateNominalTestSuitesController.fail(
        res,
        'update nominal test suites - Unknown error occured'
      );
    }
  }
}
