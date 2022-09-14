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
    // Create an Amazon EventBridge service client object.
    const eventBridgeClient = new EventBridgeClient({ region: REGION });

    // 
    // Name: string | undefined;
    //  The name of the rule that you are creating or updating
    //  
    // ScheduleExpression?: string;
    // (cron)
    //  The scheduling expression. For example, "cron(0 20 * * ? *)"
    // 
    // EventPattern?: string; (non necessary?)
    //  The event pattern. For more information, see <a href="https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html.html">EventBridge event
    //  patterns</a> in the <i>Amazon EventBridge User Guide</i>.</p>
    //  
    // State?: RuleState | string;
    //  * <p>Indicates whether the rule is enabled or disabled.</p>
    // 
    // Description?: string;
    //  A description of the rule
    // 
    // RoleArn?: string;
    //  * <p>The Amazon Resource Name (ARN) of the IAM role associated with the rule.</p>
    //  *          <p>If you're setting an event bus in another account as the target and that account granted
    //  *       permission to your account through an organization instead of directly by the account ID, you
    //  *       must specify a <code>RoleArn</code> with proper permissions in the <code>Target</code>
    //  *       structure, instead of here in this parameter.</p>
    //  
    //  Tags?: Tag[];
    //  * <p>The list of key-value pairs to associate with the rule.</p>
    //  */
    // 
    // EventBusName?: string;
    //  * <p>The name or ARN of the event bus to associate with this rule. If you omit this, the
    //  *       default event bus is used.</p>
    //  */

    // const cronExpr = this.#rruleToCron(rule);

    const params = {
      Name: `Custom frequency for test suite: ${id}`,
      ScheduleExpression: cron,
      State: "ENABLED",
    };


    try {
      const data = await eventBridgeClient.send(new PutRuleCommand(params));
      console.log("Success, scheduled rule created; Rule ARN:", data);
      return data;
    } catch (err:any) {
      console.log(err.message);
      throw new Error("Unable to create cron job");
    }
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
      console.log(`Success with cron ${requestDto.cron}`);

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
