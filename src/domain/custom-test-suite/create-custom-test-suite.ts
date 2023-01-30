import { v4 as uuidv4 } from 'uuid';
import Result from '../value-types/transient-types/result';
import { CustomTestSuite } from '../entities/custom-test-suite';
import { ExecutionType } from '../value-types/execution-type';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface CreateCustomTestSuiteRequestDto {
  entityProps: {
    activated: boolean;
    threshold: number;
    cron: string;
    executionType: ExecutionType;
    name: string;
    description: string;
    sqlLogic: string;
    targetResourceIds: string[];
  };
}

export type CreateCustomTestSuiteAuthDto = null;

export type CreateCustomTestSuiteResponseDto = Result<CustomTestSuite>;

export class CreateCustomTestSuite
  implements
    IUseCase<
      CreateCustomTestSuiteRequestDto,
      CreateCustomTestSuiteResponseDto,
      CreateCustomTestSuiteAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: CreateCustomTestSuiteRequestDto;
    connPool: IConnectionPool;
  }): Promise<CreateCustomTestSuiteResponseDto> {
    const { req, connPool } = props;

    try {
      const customTestSuite = CustomTestSuite.create({
        id: uuidv4(),
        name: req.entityProps.name,
        description: req.entityProps.description,
        sqlLogic: req.entityProps.sqlLogic,
        activated: req.entityProps.activated,
        cron: req.entityProps.cron,
        executionType: req.entityProps.executionType,
        threshold: req.entityProps.threshold,
        targetResourceIds: req.entityProps.targetResourceIds,
        importanceThreshold: -1,
        boundsIntervalRelative: 0,
        deleted: false,
      });

      await this.#repo.insertOne(customTestSuite, connPool);

      return Result.ok(customTestSuite);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
