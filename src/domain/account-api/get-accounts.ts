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

  async execute(props: {
    req: GetAccountsRequestDto;
    auth: GetAccountsAuthDto;
  }): Promise<GetAccountsResponseDto> {
    const { req, auth } = props;

    try {
      const getAccountsResponse: AccountDto[] =
        await this.#accountApiRepo.getBy(
          new URLSearchParams({ userId: req.userId }),
          auth.jwt
        );

      if (!getAccountsResponse.length)
        throw new Error(`No accounts found for user id ${req.userId}`);

      return Result.ok(getAccountsResponse);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
