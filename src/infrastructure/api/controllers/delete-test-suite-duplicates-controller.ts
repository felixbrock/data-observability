// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

import {
  DeleteTestSuiteDuplicates,
  DeleteTestSuiteDuplicatesRequestDto,
  DeleteTestSuiteDuplicatesResponseDto,
} from '../../../domain/test-suite/delete-test-suite-duplicates';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class DeleteTestSuiteDuplicatesController extends BaseController {
  readonly #deleteTestSuiteDuplicates: DeleteTestSuiteDuplicates;

  constructor(
    deleteTestSuiteDuplicates: DeleteTestSuiteDuplicates,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#deleteTestSuiteDuplicates = deleteTestSuiteDuplicates;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): DeleteTestSuiteDuplicatesRequestDto => {
    const { testSuiteIds, targetOrgId } = httpRequest.query;

    if (
      (testSuiteIds && typeof testSuiteIds !== 'string') ||
      typeof targetOrgId !== 'string'
    )
      throw new Error(
        'Received test suite deletion req params in invalid format'
      );

    return {
      testSuiteIds: testSuiteIds ? testSuiteIds.split(',') : [],
      targetOrgId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return DeleteTestSuiteDuplicatesController.unauthorized(
          res,
          'Unauthorized - auth-header missing'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return DeleteTestSuiteDuplicatesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        throw new Error('Unauthorized - Only system internal users allowed');

      const requestDto: DeleteTestSuiteDuplicatesRequestDto =
        this.#buildRequestDto(req);

      const connPool = await this.createConnectionPool(
        jwt,
        createPool,
        requestDto.targetOrgId
      );

      const useCaseResult: DeleteTestSuiteDuplicatesResponseDto =
        await this.#deleteTestSuiteDuplicates.execute({
          req: requestDto,
          connPool,
        });

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        // return DeleteTestSuiteDuplicatesController.badRequest(res);
        return DeleteTestSuiteDuplicatesController.ok(res, CodeHttp.OK);
      }

      return DeleteTestSuiteDuplicatesController.ok(res, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      // return DeleteTestSuiteDuplicatesController.fail(
      //   res,
      //   'delete test suites - Internal error occurred'
      // );
      return DeleteTestSuiteDuplicatesController.ok(res, CodeHttp.OK);
    }
  }
}
