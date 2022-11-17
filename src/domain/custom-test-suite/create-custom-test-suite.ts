// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import { CustomTestSuite} from '../entities/custom-test-suite';
import { ExecutionType } from '../value-types/execution-type';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import BaseSfQueryUseCase from '../services/base-sf-query-use-case';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';

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
  profile?: SnowflakeProfileDto;
}

export interface CreateCustomTestSuiteAuthDto {
  jwt: string;
  callerOrgId: string;
  isSystemInternal: boolean;
}

export type CreateCustomTestSuiteResponseDto = Result<CustomTestSuite>;

export class CreateCustomTestSuite
  extends BaseSfQueryUseCase<
      CreateCustomTestSuiteRequestDto,
      CreateCustomTestSuiteResponseDto,
      CreateCustomTestSuiteAuthDto
    >
{

  readonly #repo:  ICustomTestSuiteRepo;

  constructor(
    getSnowflakeProfile: GetSnowflakeProfile, repo: ICustomTestSuiteRepo
  ) {
    super(getSnowflakeProfile);
    this.#repo = repo;
  }

  async execute(
    request: CreateCustomTestSuiteRequestDto,
    auth: CreateCustomTestSuiteAuthDto
  ): Promise<CreateCustomTestSuiteResponseDto> {
    try {
      const customTestSuite = CustomTestSuite.create({
        id: new ObjectId().toHexString(),
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

      const profile = request.profile || (await this.getProfile(auth.jwt));

      await this.#repo.insertOne(customTestSuite, profile, auth);

      return Result.ok(customTestSuite);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
