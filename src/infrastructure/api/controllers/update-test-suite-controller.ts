// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { EventBridgeClient, PutRuleCommand } from "@aws-sdk/client-eventbridge";
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateTestSuite,
  UpdateTestSuiteAuthDto,
  UpdateTestSuiteRequestDto,
  UpdateTestSuiteResponseDto,
} from '../../../domain/test-suite/update-test-suite';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import { appConfig } from '../../../config';

export default class UpdateTestSuiteController extends BaseController {
  readonly #updateTestSuite: UpdateTestSuite;

  readonly #getAccounts: GetAccounts;

  constructor(updateTestSuite: UpdateTestSuite, getAccounts: GetAccounts) {
    super();
    this.#getAccounts = getAccounts;
    this.#updateTestSuite = updateTestSuite;
  }

  #buildRequestDto = (httpRequest: Request): UpdateTestSuiteRequestDto => ({
    id: httpRequest.params.testSuiteId,
    activated: httpRequest.body.activated,
    threshold: httpRequest.body.threshold,
    frequency: httpRequest.body.frequency,
    cron: httpRequest.body.cron,
  });

  #buildAuthDto = (jwt: string): UpdateTestSuiteAuthDto => ({
    jwt
  });

  #createCronJob = async (id: string, cron: string): Promise<any> => {

    const REGION = "eu-central-1";
    const eventBridgeClient = new EventBridgeClient({ region: REGION });

   

    const command = new PutRuleCommand(
      {
        Name: `TestSuite-${id}`,
        ScheduleExpression: `cron(${cron})`,
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
        return UpdateTestSuiteController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateTestSuiteController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateTestSuiteController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateTestSuiteRequestDto = this.#buildRequestDto(req);
      const authDto: UpdateTestSuiteAuthDto = this.#buildAuthDto(
        jwt
      );

      const useCaseResult: UpdateTestSuiteResponseDto =
        await this.#updateTestSuite.execute(
          requestDto,
          authDto,
        );


      if (!useCaseResult.success) {
        return UpdateTestSuiteController.badRequest(res, useCaseResult.error);
      }

      if (requestDto.cron) {
        this.#createCronJob(requestDto.id, requestDto.cron);
      }

      const resultValue = useCaseResult.value;

      return UpdateTestSuiteController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return UpdateTestSuiteController.fail(res, error);
      if (error instanceof Error)
        return UpdateTestSuiteController.fail(res, error);
      return UpdateTestSuiteController.fail(res, 'Unknown error occured');
    }
  }
}
