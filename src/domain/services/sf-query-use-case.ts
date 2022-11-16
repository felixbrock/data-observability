import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import { SnowflakeQueryResult } from '../snowflake-api/i-snowflake-api-repo';
import {
  QuerySnowflake,
  QuerySnowflakeAuthDto,
  QuerySnowflakeRequestDto,
} from '../snowflake-api/query-snowflake';
import IUseCase from './use-case';

export default abstract class SfQueryUseCase<ReqDto, ResDto, AuthDto>
  implements IUseCase<ReqDto, ResDto, AuthDto>
{
  readonly #getSnowflakeProfile: GetSnowflakeProfile;

  readonly #querySnowflake: QuerySnowflake;

  constructor(
    querySnowflake: QuerySnowflake,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    this.#querySnowflake = querySnowflake;
    this.#getSnowflakeProfile = getSnowflakeProfile;
  }

  getProfile = async (
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto> => {
    const readSnowflakeProfileResult = await this.#getSnowflakeProfile.execute(
      { targetOrgId },
      {
        jwt,
      }
    );

    if (!readSnowflakeProfileResult.success)
      throw new Error(readSnowflakeProfileResult.error);
    if (!readSnowflakeProfileResult.value)
      throw new Error('SnowflakeProfile does not exist');

    return readSnowflakeProfileResult.value;
  };

  querySf = async (
    req: QuerySnowflakeRequestDto,
    auth: QuerySnowflakeAuthDto
  ): Promise<SnowflakeQueryResult> => {
    const queryResult = await this.#querySnowflake.execute(req, auth);

    if (!queryResult.success) throw new Error(queryResult.error);
    if (!queryResult.value)
      throw new Error('Query failed. Not content element found');

    return queryResult.value;
  };

  abstract execute(
    request: ReqDto,
    auth: AuthDto,
    dbConnection: undefined
  ): ResDto | Promise<ResDto>;
}
