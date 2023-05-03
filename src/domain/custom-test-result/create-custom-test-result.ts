// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import { CustomTestResult } from '../value-types/custom-test-result';
import { ICustomTestResultRepo } from './i-custom-test-result-repo';

export interface CreateCustomTestResultRequestDto
  extends Omit<CustomTestResult, 'organizationId'> {
  targetOrgId: string;
}

export type CreateCustomTestResultAuthDto = null;

export type CreateCustomTestResultResponseDto = Result<CustomTestResult>;

export class CreateCustomTestResult
  implements
    IUseCase<
      CreateCustomTestResultRequestDto,
      CreateCustomTestResultResponseDto,
      null,
      IDbConnection
    >
{
  readonly #customTestResultRepo: ICustomTestResultRepo;

  constructor(customTestResultRepo: ICustomTestResultRepo) {
    this.#customTestResultRepo = customTestResultRepo;
  }

  async execute(props: {
    req: CreateCustomTestResultRequestDto;
    dbConnection: IDbConnection;
  }): Promise<CreateCustomTestResultResponseDto> {
    const { req } = props;

    try {

      const customTestResult: CustomTestResult = {
        ...req,
        organizationId: req.targetOrgId,
      };

      // await this.#customTestResultRepo.insertOne(
      //   customTestResult,
      //   dbConnection
      // );

      return Result.ok(customTestResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}