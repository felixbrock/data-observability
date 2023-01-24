// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  PostAnomalyFeedback,
  PostAnomalyFeedbackAuthDto,
  PostAnomalyFeedbackRequestDto,
  PostAnomalyFeedbackResponseDto,
} from '../../../domain/snowflake-api/post-anomaly-feedback';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class PostAnomalyFeedbackController extends BaseController {
  readonly #postAnomalyFeedback: PostAnomalyFeedback;

  constructor(
    postAnomalyFeedback: PostAnomalyFeedback,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#postAnomalyFeedback = postAnomalyFeedback;
  }

  #buildRequestDto = (httpRequest: Request): PostAnomalyFeedbackRequestDto => {
    const {
      alertId,
      testType,
      userFeedbackIsAnomaly,
      importance,
      testSuiteId,
    } = httpRequest.body;

    if (
      Number.isNaN(Number(userFeedbackIsAnomaly)) ||
      Number.isNaN(Number(importance))
    )
      throw new Error('Provided NaN numerical input data');

    return {
      alertId,
      testType,
      userFeedbackIsAnomaly: parseInt(userFeedbackIsAnomaly, 10),
      importance: parseFloat(importance),
      testSuiteId,
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): PostAnomalyFeedbackAuthDto => {
    if (!userAccountInfo.callerOrgId) throw new Error('callerOrgId missing');
    return {
      jwt,
      callerOrgId: userAccountInfo.callerOrgId,
      isSystemInternal: userAccountInfo.isSystemInternal,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return PostAnomalyFeedbackController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return PostAnomalyFeedbackController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: PostAnomalyFeedbackRequestDto =
        this.#buildRequestDto(req);
      const authDto: PostAnomalyFeedbackAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value,
        jwt
      );

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: PostAnomalyFeedbackResponseDto =
        await this.#postAnomalyFeedback.execute({
          req: requestDto,
          auth: authDto,
          connPool,
        });

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return PostAnomalyFeedbackController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return PostAnomalyFeedbackController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return PostAnomalyFeedbackController.fail(
        res,
        'post anomaly feedback - Unknown error occurred'
      );
    }
  }
}
