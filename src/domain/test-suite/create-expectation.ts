// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  Expectation,
} from '../entities/expectation';

export interface CreateExpectationRequestDto {
  type: string;
  configuration: {[key: string]: string | number};
}

export interface CreateExpectationAuthDto {
  organizationId: string;
}

export type CreateExpectationResponseDto = Result<Expectation>;

export class CreateExpectation
  implements
    IUseCase<
      CreateExpectationRequestDto,
      CreateExpectationResponseDto,
      CreateExpectationAuthDto
    >
{

  async execute(
    request: CreateExpectationRequestDto,
    auth: CreateExpectationAuthDto,
  ): Promise<CreateExpectationResponseDto> {
    console.log(auth);
    try {
      const expectation = Expectation.create({
        localId: new ObjectId().toHexString(),
        configuration: request.configuration,
        type: request.type,
      });

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(expectation);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
