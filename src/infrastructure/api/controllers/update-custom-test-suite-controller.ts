// TODO: Violation of control flow. DI for express instead
import { EventBridgeClient, PutRuleCommand } from '@aws-sdk/client-eventbridge';
import { Request, Response } from 'express';
import { appConfig } from '../../../config';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateCustomTestSuite,
  UpdateCustomTestSuiteAuthDto,
  UpdateCustomTestSuiteRequestDto,
  UpdateCustomTestSuiteResponseDto,
} from '../../../domain/custom-test-suite/update-custom-test-suite';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class UpdateCustomTestSuiteController extends BaseController {
  readonly #updateCustomTestSuite: UpdateCustomTestSuite;

  readonly #getAccounts: GetAccounts;

  constructor(
    updateCustomTestSuite: UpdateCustomTestSuite,
    getAccounts: GetAccounts
  ) {
    super();
    this.#getAccounts = getAccounts;
    this.#updateCustomTestSuite = updateCustomTestSuite;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateCustomTestSuiteRequestDto => ({
    id: httpRequest.params.customTestSuiteId,
    activated: httpRequest.body.activated,
    threshold: httpRequest.body.threshold,
    frequency: httpRequest.body.frequency,
    cron: httpRequest.body.cron,
  });

  #buildAuthDto = (jwt: string): UpdateCustomTestSuiteAuthDto => ({
    jwt,
  });

  #createCronJob = async (id: string, cron: string): Promise<any> => {

    const REGION = "eu-central-1";
    const eventBridgeClient = new EventBridgeClient({ region: REGION });

    const command = new PutRuleCommand(
      {
        Name: `TestSuite-${id}`,
        ScheduleExpression: cron,
        State: "ENABLED",
      }
    );

    const response = await eventBridgeClient.send(command);
    if (response.RuleArn) 
      return response.RuleArn;
    throw new Error(
      `Unexpected http status (${response.$metadata.httpStatusCode}) code when creating cron job: ${response}`
    );
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateCustomTestSuiteController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateCustomTestSuiteController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateCustomTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateCustomTestSuiteRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateCustomTestSuiteAuthDto = this.#buildAuthDto(jwt);

      const useCaseResult: UpdateCustomTestSuiteResponseDto =
        await this.#updateCustomTestSuite.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return UpdateCustomTestSuiteController.badRequest(
          res,
          useCaseResult.error
        );
      }

      if (requestDto.cron && appConfig.express.mode === 'production') {
        this.#createCronJob(requestDto.id, requestDto.cron);
      }

      const resultValue = useCaseResult.value;
      if (!resultValue) UpdateCustomTestSuiteController.fail(res, 'Update failed. Internal error.');

      return UpdateCustomTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return UpdateCustomTestSuiteController.fail(res, error);
      if (error instanceof Error)
        return UpdateCustomTestSuiteController.fail(res, error);
      return UpdateCustomTestSuiteController.fail(res, 'Unknown error occured');
    }
  }
}
