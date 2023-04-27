import { Document } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';

export interface ReadSelectedTestSuiteRequestDto {
    targetResourceId: string,
    activated: string
}

export type ReadSelectedTestSuiteAuthDto = {
  callerOrgId: string
};

export type ReadSelectedTestSuiteResponseDto = Result<Document[] | null>;

export class ReadSelectedTestSuite
  implements
    IUseCase<
      ReadSelectedTestSuiteRequestDto,
      ReadSelectedTestSuiteResponseDto,
      ReadSelectedTestSuiteAuthDto,
      IDbConnection
    >
{

  async execute(props: {
    req: ReadSelectedTestSuiteRequestDto;
    auth: ReadSelectedTestSuiteAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadSelectedTestSuiteResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      
      const results = await dbConnection
      .collection(`test_suites_${auth.callerOrgId}`)
      .find({
        target_resource_id: req.targetResourceId,
        activated: req.activated,
        deleted_at: null
      }).toArray();

      return Result.ok(results);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}