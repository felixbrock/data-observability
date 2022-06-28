import { URLSearchParams } from "url";
import { AccountDto } from "./account-dto";

export interface IAccountApiRepo {
  getBy(params: URLSearchParams, jwt: string): Promise<AccountDto[]>;
}