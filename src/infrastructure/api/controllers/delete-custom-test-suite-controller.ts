import { Request, Response } from 'express';
import Dbo from '../../persistence/db/mongo-db';
import { BaseController, CodeHttp, UserAccountInfo } from './shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import { DeleteCustomTestSuite, DeleteCustomTestSuiteRequestDto, DeleteCustomTestSuiteResponseDto, parseMode } from '../../../domain/custom-test-suite/delete-custom-test-suite';


export default class DeleteCustomTestSuiteController extends BaseController {
    readonly #deleteCustomTestSuite: DeleteCustomTestSuite;

    readonly #dbo: Dbo;

    constructor(
        deleteCustomTestSuite: DeleteCustomTestSuite,
        getAccounts: GetAccounts,
        getSnowflakeProfile: GetSnowflakeProfile,
        dbo: Dbo
      ) {
        super(getAccounts, getSnowflakeProfile);
    
        this.#deleteCustomTestSuite = deleteCustomTestSuite;
        this.#dbo = dbo;
      }
    
      #buildRequestDto = (
        httpRequest: Request
      ): DeleteCustomTestSuiteRequestDto => {
        const { id } = httpRequest.params;
        const { mode } = httpRequest.query;

        if (typeof id !== 'string') {
            throw new Error('Unexpected type of id - should be string');
        }
    
        return {
          id,
          mode: parseMode(mode)
        };
      };
    
      protected async executeImpl(req: Request, res: Response): Promise<Response> {
        try {
          const authHeader = req.headers.authorization;
    
          if (!authHeader)
            return DeleteCustomTestSuiteController.unauthorized(
              res,
              'Unauthorized - auth-header missing'
            );
    
          const jwt = authHeader.split(' ')[1];
    
          const getUserAccountInfoResult: Result<UserAccountInfo> =
            await this.getUserAccountInfo(jwt);
    
          if (!getUserAccountInfoResult.success)
            return DeleteCustomTestSuiteController.unauthorized(
              res,
              getUserAccountInfoResult.error
            );
          if (!getUserAccountInfoResult.value)
            throw new ReferenceError('Authorization failed');
    
          if (!getUserAccountInfoResult.value.callerOrgId)
            throw new Error('Unauthorized - Caller organization id missing');
    
          const requestDto: DeleteCustomTestSuiteRequestDto =
            this.#buildRequestDto(req);
    
    
          const useCaseResult: DeleteCustomTestSuiteResponseDto =
            await this.#deleteCustomTestSuite.execute({
              req: requestDto,
              auth: { callerOrgId: getUserAccountInfoResult.value.callerOrgId },
              dbConnection: this.#dbo.dbConnection,
            });
          
    
          if (!useCaseResult.success) {
            return DeleteCustomTestSuiteController.badRequest(res);
          }
    
          return DeleteCustomTestSuiteController.ok(res, CodeHttp.OK);
        } catch (error: unknown) {
          if (error instanceof Error) console.error(error.stack);
          else if (error) console.trace(error);
          return DeleteCustomTestSuiteController.fail(
            res,
            'delete test suites - Internal error occurred'
          );
        }
      }

}