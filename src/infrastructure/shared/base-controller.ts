import { Request, Response } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { appConfig } from '../../config';
import {
  GetAccounts,
  GetAccountsResponseDto,
} from '../../domain/account-api/get-accounts';
import Result from '../../domain/value-types/transient-types/result';

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
  userId: string;
  accountId: string;
  callerOrganizationId: string;
  isSystemInternal: boolean;
}

export abstract class BaseController {
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

  static async getUserAccountInfo(
    jwt: string,
    getAccounts: GetAccounts
  ): Promise<Result<UserAccountInfo>> {
    if (!jwt) return Result.fail('Unauthorized');

    try {
      const client = jwksClient({
        jwksUri: `https://cognito-idp.${appConfig.cloud.region}.amazonaws.com/${appConfig.cloud.authEnvConfig.userPoolId}/.well-known/jwks.json`,
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

      const getAccountsResult: GetAccountsResponseDto =
        await getAccounts.execute(
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

      return Result.ok({
        userId: authPayload.username,
        accountId: getAccountsResult.value[0].id,
        callerOrganizationId: getAccountsResult.value[0].organizationId,
        isSystemInternal: authPayload['cognito:groups']
          ? authPayload['cognito:groups'].includes('system-internal')
          : false,
      });
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }

  static ok<T>(res: Response, dto?: T, created?: CodeHttp): Response {
    const codeHttp: CodeHttp = created || CodeHttp.OK;
    if (dto) {
      res.type('application/json');

      return res.status(codeHttp).json(dto);
    }
    return res.sendStatus(codeHttp);
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