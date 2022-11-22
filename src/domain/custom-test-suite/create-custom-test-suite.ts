import { v4 as uuidv4 } from 'uuid';
import Result from '../value-types/transient-types/result';
import { CustomTestSuite} from '../entities/custom-test-suite';
import { ExecutionType } from '../value-types/execution-type';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface CreateCustomTestSuiteRequestDto {
  entityProps: {activated: boolean;
  threshold: number;
  executionFrequency: number;
  cron?: string;
  executionType: ExecutionType;
  name: string;
  description: string;
  sqlLogic: string;
  targetResourceIds: string[];}
}

export interface CreateCustomTestSuiteAuthDto {
  jwt: string;
  callerOrgId: string;
  isSystemInternal: boolean;
}

export type CreateCustomTestSuiteResponseDto = Result<CustomTestSuite>;

export class CreateCustomTestSuite
  implements IUseCase<
      CreateCustomTestSuiteRequestDto,
      CreateCustomTestSuiteResponseDto,
      CreateCustomTestSuiteAuthDto,
      IConnectionPool
    >
{

  readonly #repo:  ICustomTestSuiteRepo;

  constructor(
    customTestSuiteRepo: CustomTestSuiteRepo
  ) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(
    request: CreateCustomTestSuiteRequestDto,
    auth: CreateCustomTestSuiteAuthDto,
    connPool: IConnectionPool
  ): Promise<CreateCustomTestSuiteResponseDto> {
    try {
      const customTestSuite = CustomTestSuite.create({
        id: uuidv4(),
        name: request.entityProps.name,
        description: request.entityProps.description,
        sqlLogic: request.entityProps.sqlLogic,
        activated: request.entityProps.activated,
        executionFrequency: request.entityProps.executionFrequency,
        cron: request.entityProps.cron,
        executionType: request.entityProps.executionType,
        organizationId: auth.callerOrgId,
        threshold: request.entityProps.threshold,
        targetResourceIds: request.entityProps.targetResourceIds,
      });

      await this.#repo.insertOne(customTestSuite, auth, connPool);

      return Result.ok(customTestSuite);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
