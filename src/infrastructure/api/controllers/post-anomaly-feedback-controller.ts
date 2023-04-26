// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  PostAnomalyFeedback,
  PostAnomalyFeedbackAuthDto,
  PostAnomalyFeedbackRequestDto,
  PostAnomalyFeedbackResponseDto,
  ThresholdType,
} from '../../../domain/snowflake-api/post-anomaly-feedback';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';
import Dbo from '../../persistence/db/mongo-db';

export default class PostAnomalyFeedbackController extends BaseController {
  readonly #postAnomalyFeedback: PostAnomalyFeedback;

  readonly #dbo: Dbo;

  constructor(
    postAnomalyFeedback: PostAnomalyFeedback,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#postAnomalyFeedback = postAnomalyFeedback;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): PostAnomalyFeedbackRequestDto => {
    const {
      alertId,
      testType,
      userFeedbackIsAnomaly,
      detectedValue,
      thresholdType,
      testSuiteId,
    } = httpRequest.body;

    const isThresholdType = (obj: unknown): obj is ThresholdType =>
      !!obj &&
      typeof obj === 'string' &&
      ['lower', 'upper'].includes(thresholdType);

    if (
      Number.isNaN(Number(userFeedbackIsAnomaly)) ||
      Number.isNaN(Number(detectedValue)) ||
      !isThresholdType(thresholdType) ||
      typeof thresholdType !== 'string'
    )
      throw new Error(
        'Provision of invalid post anomaly feedback request params'
      );

    return {
      alertId,
      testType,
      userFeedbackIsAnomaly: parseInt(userFeedbackIsAnomaly, 10),
      detectedValue: parseFloat(detectedValue),
      thresholdType,
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

      const useCaseResult: PostAnomalyFeedbackResponseDto =
        await this.#postAnomalyFeedback.execute({
          req: requestDto,
          auth: authDto,
          dbConnection: this.#dbo.dbConnection
        });

      await this.#dbo.releaseConnections();

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
