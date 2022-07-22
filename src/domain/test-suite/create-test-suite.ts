// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite, TestType } from '../entities/test-suite';
import { ITestSuiteRepo } from './i-test-suite-repo';
import { DbConnection } from '../services/i-db';
import { Frequency } from '../value-types/job';

export interface CreateTestSuiteRequestDto {
  targetId: string;
  activated: boolean;
  type: TestType;
  expectationConfiguration: { [key: string]: string | number };
  jobFrequency: Frequency;
}

export interface CreateTestSuiteAuthDto {
  organizationId: string;
}

export type CreateTestSuiteResponseDto = Result<TestSuite>;

export class CreateTestSuite
  implements
    IUseCase<
      CreateTestSuiteRequestDto,
      CreateTestSuiteResponseDto,
      CreateTestSuiteAuthDto,
      DbConnection
    >
{
  readonly #testSuiteRepo: ITestSuiteRepo;

  #dbConnection: DbConnection;

  constructor(testSuiteRepo: ITestSuiteRepo) {
    this.#testSuiteRepo = testSuiteRepo;
  }

  async execute(
    request: CreateTestSuiteRequestDto,
    auth: CreateTestSuiteAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateTestSuiteResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const testSuite = TestSuite.create({
        id: new ObjectId().toHexString(),
        activated: request.activated,
        expectationConfiguration: request.expectationConfiguration,
        jobFrequency: request.jobFrequency,
        type: request.type,
        targetId: request.targetId,
      });

      await this.#testSuiteRepo.insertOne(testSuite, this.#dbConnection);

//       const snowflakeQuery = [...oldData];

//       snowflakeQuery.sort(
//         (a: { [key: string]: any }, b: { [key: string]: any }) => {
//           if (a.uploaded > b.uploaded) return -1;
//           if (a.uploaded < b.uploaded) return 1;
//           return 0;
//         }
//       );

//       const history = [];


// type SnowflakeRow = {[key: string]: any};

// const something: SnowflakeRow  = [
//         { value: 71, uploaded: '2022-07-06T02:33:22Z' },
//         { value: 77, uploaded: '2022-07-01T19:31:33Z' },
//         { value: 74, uploaded: '2022-07-03T22:57:12Z' },
//         { value: 80, uploaded: '2022-07-01T17:03:57Z' },
//         { value: 70, uploaded: '2022-07-02T07:09:00Z' },];

// const getOldestEntry = (prev: SnowflakeRow, curr: SnowflakeRow) => prev.uploaded < curr.uploaded ? prev : curr;
// const getNewestEntry = (prev: SnowflakeRow, curr: SnowflakeRow) => prev.uploaded > curr.uploaded ? prev : curr;

// const oldestDate: SnowflakeRow = something.reduce(getOldestEntry).uploaded;
// const newestDate: SnowflakeRow = something.reduce(getOldestEntry).uploaded;



      

//       const latestDay = 

//       const lowerBound = '2022-07-03T00:00:00Z';
//       const upperBound = '2022-07-03T23:59:59Z';
      
//       const data = [
//         { value: 71, uploaded: '2022-07-06T02:33:22Z' },
//         { value: 77, uploaded: '2022-07-01T19:31:33Z' },
//         { value: 74, uploaded: '2022-07-03T22:57:12Z' },
//         { value: 80, uploaded: '2022-07-01T17:03:57Z' },
//         { value: 70, uploaded: '2022-07-02T07:09:00Z' },];
      
//       console.log(data.filter(element => element.uploaded >= lowerBound && element.uploaded <= upperBound))





      /* Trigger: Test is activated


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

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
