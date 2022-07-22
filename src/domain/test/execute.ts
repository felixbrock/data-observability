import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuiteDto } from '../test-suite/test-suite-dto';
import {
  parseTestType,
  Target,
  TestSuite,
  TestType,
  testTypes,
} from '../entities/test-suite';
import { Job } from '../value-types/job';
import Query from '../value-types/query';
import { testHistory, testRowCount } from '../snowflake-api/test-data';

export interface ExecuteTestRequestDto {
  testSuite: TestSuite;
}

export interface ExecuteTestAuthDto {
  // todo - secure? optional due to organization agnostic cron job requests
  organizationId?: string;
}

export type ExecuteTestResponseDto = Result<TestExecutionResultDto>;

const getQuery = (type: TestType, target: Target) => {
  switch (type) {
    case parseTestType(testTypes[7]):
      return Query.rowCount(
        target.databaseName,
        target.tableSchema,
        target.tableName
      );
      break;
    default:
      throw new TypeError('Test Type not valid');
      break;
  }
};

export class ExecuteTest
  implements
    IUseCase<ExecuteTestRequestDto, ExecuteTestResponseDto, ExecuteTestAuthDto>
{
  readonly #testExecutionApiRepo: ITestExecutionApiRepo;

  constructor(testExecutionApiRepo: ITestExecutionApiRepo) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
  }

  async execute(
    request: ExecuteTestRequestDto
  ): Promise<ExecuteTestResponseDto> {
    try {
      const query = getQuery(request.type, request.target);

      // Read SF resources - to retrieve current data from corresponding mat

      // Read SF resources - to retrieve Cito history

      // POST test run - req to test-engine-service

      // Write SF resources - write test result

      // Write SF resources - write alert

      // Write SF resources - write new history values

      const currentRowCount = testRowCount;
      const currentHistory = testHistory;

      currentHistory.push({rowCount: currentRowCount.ROW_COUNT, createdAt: new Date(Date.now()).toISOString()});

      


      // Get data

      Run 

      return Result.ok(executionResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
