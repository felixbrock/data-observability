import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  IDataValidationApiRepo,
  DataValidationResultDto,
} from './i-data-validation-api-repo';
import { Data, ExpectationConfiguration } from './data-validation-dto';

export interface ValidateDataRequestDto {
  expectationType: string;
  expectationConfiguration: ExpectationConfiguration;
  data: Data;
}

export interface ValidateDataAuthDto {
  // todo - secure? optional due to organization agnostic cron job requests
  organizationId?: string;
}

export type ValidateDataResponseDto = Result<DataValidationResultDto>;

export class ValidateData
  implements
    IUseCase<
      ValidateDataRequestDto,
      ValidateDataResponseDto,
      ValidateDataAuthDto
    >
{
  readonly #dataValidationApiRepo: IDataValidationApiRepo;



  constructor(
    dataValidationApiRepo: IDataValidationApiRepo,
  ) {
    this.#dataValidationApiRepo = dataValidationApiRepo;
  }

  async execute(
    request: ValidateDataRequestDto,
  ): Promise<ValidateDataResponseDto> {
    try {
      const validationResult: DataValidationResultDto =
        await this.#dataValidationApiRepo.validate({
          expectationType: request.expectationType,
          expectationConfiguration: request.expectationConfiguration,
          data: request.data,
        });

      return Result.ok(validationResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
