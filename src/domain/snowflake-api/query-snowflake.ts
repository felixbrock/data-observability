import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {} from '../services/i-db';
import {
  ISnowflakeApiRepo,
  SnowflakeQueryResult,
} from './i-snowflake-api-repo';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';

export interface QuerySnowflakeRequestDto {
  queryText: string;
  binds: (string | number)[] | (string | number)[][];
  targetOrgId?: string;
  profile: SnowflakeProfileDto;
}

export interface QuerySnowflakeAuthDto {
  callerOrgId?: string;
  isSystemInternal: boolean;
  jwt: string;
}

export type QuerySnowflakeResponseDto = Result<SnowflakeQueryResult>;

export class QuerySnowflake
  implements
    IUseCase<
      QuerySnowflakeRequestDto,
      QuerySnowflakeResponseDto,
      QuerySnowflakeAuthDto
    >
{
  readonly #snowflakeApiRepo: ISnowflakeApiRepo;

  constructor(snowflakeApiRepo: ISnowflakeApiRepo) {
    this.#snowflakeApiRepo = snowflakeApiRepo;
  }

  async execute(
    request: QuerySnowflakeRequestDto,
    auth: QuerySnowflakeAuthDto
  ): Promise<QuerySnowflakeResponseDto> {
    if (auth.isSystemInternal && !request.targetOrgId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrgId && !auth.callerOrgId)
      throw new Error('No organization Id instance provided');
    if (request.targetOrgId && auth.callerOrgId)
      throw new Error('callerOrgId and targetOrgId provided. Not allowed');

    try {
      const queryResult = await this.#snowflakeApiRepo.runQuery(
        request.queryText,
        request.binds,
        {
          account: request.profile.accountId,
          username: request.profile.username,
          password: request.profile.password,
          warehouse: request.profile.warehouseName,
        }
      );

      const stringifiedBinds = JSON.stringify(request.binds);

      if (!queryResult.success)
        {
          const queryResultBaseMsg = `AcccountId: ${
            request.profile.accountId
          } \nOrganizationId: ${
            request.profile.organizationId
          } \n Binds: ${stringifiedBinds.substring(0, 1000)}${
            stringifiedBinds.length > 1000 ? '...' : ''
          }
          \n${request.queryText.substring(0, 1000)}${
            request.queryText.length > 1000 ? '...' : ''
          }`;
          
          throw new Error(
          `Sf query failed \n${queryResultBaseMsg} \nError msg: ${queryResult.error}`
        );}

      return Result.ok(queryResult.value);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
