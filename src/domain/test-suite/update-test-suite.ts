import IUseCase from '../services/use-case';
import {
  ITestSuiteRepo,
  TestSuiteUpdateDto,
} from './i-test-suite-repo';
import Result from '../value-types/transient-types/result';
import { ReadTestSuite } from './read-test-suite';
import { DbConnection } from '../services/i-db';

export interface UpdateTestSuiteRequestDto {
  id: string;
  activated: boolean
}

export interface UpdateTestSuiteAuthDto {
  organizationId: string;
}

export type UpdateTestSuiteResponseDto = Result<string>;

export class UpdateTestSuite
  implements
    IUseCase<
      UpdateTestSuiteRequestDto,
      UpdateTestSuiteResponseDto,
      UpdateTestSuiteAuthDto, 
      DbConnection
    >
{
 readonly  #testSuiteRepo: ITestSuiteRepo;

  readonly #readTestSuite: ReadTestSuite;

  #dbConnection: DbConnection;

  constructor(
    testSuiteRepo: ITestSuiteRepo,
    readTestSuite: ReadTestSuite,
  ) {
    this.#testSuiteRepo = testSuiteRepo;
    this.#readTestSuite = readTestSuite;
  }

  async execute(
    request: UpdateTestSuiteRequestDto,
    auth: UpdateTestSuiteAuthDto,
    dbConnection: DbConnection
  ): Promise<UpdateTestSuiteResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const readTestSuiteResult = await this.#readTestSuite.execute(
        { id: request.id },
        { organizationId: auth.organizationId },
        this.#dbConnection
      );

      if (!readTestSuiteResult.success)
        throw new Error(readTestSuiteResult.error);

      if (!readTestSuiteResult.value)
        throw new Error(`TestSuite with id ${request.id} does not exist`);

      const updateDto = await this.#buildUpdateDto(
        request,
        auth.organizationId
      );
      
      const testSuiteId = await this.#testSuiteRepo.updateOne(request.id, updateDto, this.#dbConnection);

/* Trigger: Test is activated

index():
>if(History data is available)
>> latestHistoryPoint = latest history data point
>> dataPoints = Query SF Business Column between t and t-latest history point
>> BuildHistory(dataPoint)
>Else
>> dataPoints = Query SF Business Column
>> BuildHistory(dataPoints)

BuildHistory(dataPoints)
>> if (t – t-lhp > 1 day)
>>> foreach day:
>>>> dayDataPoints = dataPoints[by day]
>>>> Test(dayDataPoints)
>> else
>>> Test(dataPoints)

Test(dayDataPoints):
>>>>> zScoreResult = run z_score (Test Engine)
>>>>> outliers = zScoreResult[Outliers] (To be ignored for now; Later use-case for pattern recognition, e.g. regarding seasonality)
>>>>> dataPointsToCheck = dayDataPoints – outliers
>>>>> avg = avg(dataPointsToCheck)
>>>>> add to SF Avg History
>>>>> stdev = stdev(dataPointsToCheck)
>>>>> add to SF StDev History
 */


      return Result.ok(testSuiteId);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }

  #buildUpdateDto = async (
    request: UpdateTestSuiteRequestDto,
    organizationId: string
  ): Promise<TestSuiteUpdateDto> => {
    console.log(organizationId);
    
    const updateDto: TestSuiteUpdateDto = {};

    updateDto.activated = request.activated;

    return updateDto;
  };
}
