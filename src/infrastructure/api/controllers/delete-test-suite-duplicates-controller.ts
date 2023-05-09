// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
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
import Dbo from '../../persistence/db/mongo-db';

export default class DeleteTestSuiteDuplicatesController extends BaseController {
  readonly #deleteTestSuiteDuplicates: DeleteTestSuiteDuplicates;

  readonly #dbo: Dbo;

  constructor(
    deleteTestSuiteDuplicates: DeleteTestSuiteDuplicates,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);

    this.#deleteTestSuiteDuplicates = deleteTestSuiteDuplicates;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): DeleteTestSuiteDuplicatesRequestDto => {
    const { testSuiteIds, targetOrgId } = httpRequest.body;

    const isStringArray = (obj: unknown): obj is string[] =>
      Array.isArray(obj) && obj.every((item) => typeof item === 'string');

    if (
      (testSuiteIds && !isStringArray(testSuiteIds)) ||
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


      const useCaseResult: DeleteTestSuiteDuplicatesResponseDto =
        await this.#deleteTestSuiteDuplicates.execute({
          req: requestDto,
          dbConnection: this.#dbo.dbConnection
        });

      

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
