// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  ReadJobs,
  ReadJobsAuthDto,
  ReadJobsRequestDto,
  ReadJobsResponseDto,
} from '../../../domain/job/read-jobs';
import { buildJobDto } from '../../../domain/job/job-dto';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class ReadJobsController extends BaseController {
  readonly #readJobs: ReadJobs;

  readonly #getAccounts: GetAccounts;

  constructor(readJobs: ReadJobs, getAccounts: GetAccounts) {
    super();
    this.#readJobs = readJobs;
    this.#getAccounts = getAccounts;
  }

  #buildRequestDto = (httpRequest: Request): ReadJobsRequestDto => {
    const { frequency } = httpRequest.query;

    if (!frequency)
      throw new TypeError(
        'When querying columns the frequency must be provided'
      );
    if (typeof frequency !== 'string')
      throw new TypeError(
        'When querying columns the frequency query param must be of type string'
      );

    return { frequency };
  };

  #buildAuthDto = (userAccountInfo: UserAccountInfo): ReadJobsAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return ReadJobsController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await ReadJobsInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return ReadJobsInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: ReadJobsRequestDto = this.#buildRequestDto(req);
      // const authDto: ReadJobsAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const useCaseResult: ReadJobsResponseDto = await this.#readJobs.execute(
        requestDto,
        {
          organizationId: 'todo',
        },
        req.db
      );
      if (!useCaseResult.success) {
        return ReadJobsController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
      ? useCaseResult.value.map((element) => buildJobDto(element))
      : useCaseResult.value;

      return ReadJobsController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string') return ReadJobsController.fail(res, error);
      if (error instanceof Error) return ReadJobsController.fail(res, error);
      return ReadJobsController.fail(res, 'Unknown error occured');
    }
  }
}
