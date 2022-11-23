import { Request, Response } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { appConfig } from '../../../../config';
import {
  GetAccounts,
  GetAccountsResponseDto,
} from '../../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../../domain/integration-api/get-snowflake-profile';
import { SnowflakeProfileDto } from '../../../../domain/integration-api/i-integration-api-repo';
import { DbOptions } from '../../../../domain/services/i-db';
import { IConnectionPool } from '../../../../domain/snowflake-api/i-snowflake-api-repo';
import Result from '../../../../domain/value-types/transient-types/result';

export enum CodeHttp {
  OK = 200,
  CREATED,
  BAD_REQUEST = 400,
  UNAUTHORIZED,
  FORBIDDEN = 403,
  NOT_FOUND,
  CONFLICT = 409,
  SERVER_ERROR = 500,
}

export interface UserAccountInfo {
  userId?: string;
  accountId?: string;
  callerOrgId?: string;
  isSystemInternal: boolean;
}

export abstract class BaseController {
  readonly #getSnowflakeProfile: GetSnowflakeProfile;

  readonly #getAccounts: GetAccounts;

  constructor(getAccounts: GetAccounts, getSnowflakeProfile: GetSnowflakeProfile) {
    this.#getAccounts = getAccounts;
    this.#getSnowflakeProfile = getSnowflakeProfile;
  }

  static jsonResponse(res: Response, code: number, message: string): Response {
    return res.status(code).json({ message });
  }

  async execute(req: Request, res: Response): Promise<void | Response> {
    try {
      await this.executeImpl(req, res);
    } catch (error) {
      BaseController.fail(res, 'An unexpected error occurred');
    }
  }

  #getProfile = async (
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

  protected createConnectionPool = async (
    jwt: string,
    createPool: (
      options: DbOptions,
      poolOptions: { min: number; max: number }
    ) => IConnectionPool,
    targetOrgId?: string
  ): Promise<IConnectionPool> => {
    const profile = await this.#getProfile(jwt, targetOrgId);

    const options: DbOptions = {
      account: profile.accountId,
      password: profile.password,
      username: profile.username,
      warehouse: profile.warehouseName,
    };

    return createPool(options, {
      max: 10,
      min: 0,
    });
  };

  protected async getUserAccountInfo(
    jwt: string,
  ): Promise<Result<UserAccountInfo>> {
    if (!jwt) return Result.fail('Unauthorized');

    try {
      const client = jwksClient({
        jwksUri: `https://cognito-idp.${appConfig.cloud.region}.amazonaws.com/${appConfig.cloud.userPoolId}/.well-known/jwks.json`,
      });

      const unverifiedDecodedAuthPayload = jsonwebtoken.decode(jwt, {
        json: true,
        complete: true,
      });

      if (!unverifiedDecodedAuthPayload) return Result.fail('Unauthorized');

      const { kid } = unverifiedDecodedAuthPayload.header;

      if (!kid) return Result.fail('Unauthorized');

      const key = await client.getSigningKey(kid);
      const signingKey = key.getPublicKey();

      const authPayload = jsonwebtoken.verify(jwt, signingKey, {
        algorithms: ['RS256'],
      });

      if (typeof authPayload === 'string')
        return Result.fail('Unexpected auth payload format');

      const isSystemInternal = authPayload.scope
        ? authPayload.scope.includes('system-internal/system-internal')
        : false;

      if (isSystemInternal)
        return Result.ok({
          isSystemInternal,
          accountId: undefined,
          callerOrgId: undefined,
          userId: undefined,
        });

      const getAccountsResult: GetAccountsResponseDto =
        await this.#getAccounts.execute(
          {
            userId: authPayload.username,
          },
          { jwt }
        );

      if (!getAccountsResult.value)
        throw new ReferenceError(
          `No account found for ${authPayload.username}`
        );
      if (!getAccountsResult.value.length)
        throw new ReferenceError(
          `No account found for ${authPayload.username}`
        );

      console.log(`Requested by ${authPayload.username}`);

      return Result.ok({
        userId: authPayload.username,
        accountId: getAccountsResult.value[0].id,
        callerOrgId: getAccountsResult.value[0].organizationId,
        isSystemInternal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }

  static ok<T>(res: Response, dto?: T, created?: CodeHttp): Response {
    const codeHttp: CodeHttp = created || CodeHttp.OK;
    if (dto) {
      res.type('application/json');

      return res.status(codeHttp).json(dto);
    }
    return res.status(codeHttp).json(dto);
  }

  static badRequest(res: Response, message?: string): Response {
    return BaseController.jsonResponse(
      res,
      CodeHttp.BAD_REQUEST,
      message || 'BadRequest'
    );
  }

  static unauthorized(res: Response, message?: string): Response {
    return BaseController.jsonResponse(
      res,
      CodeHttp.UNAUTHORIZED,
      message || 'Unauthorized'
    );
  }

  static notFound(res: Response, message?: string): Response {
    return BaseController.jsonResponse(
      res,
      CodeHttp.NOT_FOUND,
      message || 'Not found'
    );
  }

  static fail(res: Response, error: Error | string): Response {
    return res.status(CodeHttp.SERVER_ERROR).json({
      message: error.toString(),
    });
  }

  protected abstract executeImpl(
    req: Request,
    res: Response
  ): Promise<Response>;
}
