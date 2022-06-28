import axios, { AxiosRequestConfig } from 'axios';
import { URLSearchParams } from 'url';
import { AccountDto } from '../../domain/account-api/account-dto';
import { IAccountApiRepo } from '../../domain/account-api/i-account-api-repo';
import getRoot from '../shared/api-root-builder';

export default class AccountApiRepo implements IAccountApiRepo {
  #path = 'api/v1';

  #serviceName = 'account';

  #port = '8081';

  getBy = async (
    params: URLSearchParams,
    jwt: string
  ): Promise<AccountDto[]> => {
    try {
      const apiRoot = await getRoot(this.#serviceName, this.#port, this.#path);

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
        params,
      };

      const response = await axios.get(`${apiRoot}/accounts`, config);
      const jsonResponse = response.data;
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(typeof error === 'string') return Promise.reject(error);
      if(error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };
}
