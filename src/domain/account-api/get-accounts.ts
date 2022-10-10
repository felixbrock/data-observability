import { URLSearchParams } from 'url';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IAccountApiRepo } from './i-account-api-repo';
import { AccountDto } from './account-dto';

export interface GetAccountsRequestDto {
  userId: string;
}

export interface GetAccountsAuthDto {
  jwt: string;
}

export type GetAccountsResponseDto = Result<AccountDto[]>;

export class GetAccounts
  implements
    IUseCase<GetAccountsRequestDto, GetAccountsResponseDto, GetAccountsAuthDto>
{
  readonly #accountApiRepo: IAccountApiRepo;

  constructor(accountApiRepo: IAccountApiRepo) {
    this.#accountApiRepo = accountApiRepo;
  }

  async execute(
    request: GetAccountsRequestDto,
    auth: GetAccountsAuthDto
  ): Promise<GetAccountsResponseDto> {
    try {
      const getAccountsResponse: AccountDto[] =
        await this.#accountApiRepo.getBy(
          new URLSearchParams({ userId: request.userId }),
          auth.jwt
        );

      if (!getAccountsResponse.length)
        throw new Error(`No accounts found for user id ${request.userId}`);

      return Result.ok(getAccountsResponse);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
