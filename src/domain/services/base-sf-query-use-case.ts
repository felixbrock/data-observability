import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import IUseCase from './use-case';

export default abstract class BaseSfQueryUseCase<ReqDto, ResDto, AuthDto>
  implements IUseCase<ReqDto, ResDto, AuthDto>
{
  readonly #getSnowflakeProfile: GetSnowflakeProfile;
  AcccountId: ${
    request.profile.accountId
  } \nOrganizationId: ${
    request.profile.organizationId
  } \n 

  constructor(
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    this.#getSnowflakeProfile = getSnowflakeProfile;
  }

  protected getProfile = async (
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

  abstract execute(
    request: ReqDto,
    auth: AuthDto,
    dbConnection: undefined
  ): ResDto | Promise<ResDto>;
}
