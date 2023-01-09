// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDb, IDbConnection } from '../services/i-db';
import { QuantTestAlertDto } from '../integration-api/slack/quant-test-alert-dto';
import { SendQuantTestSlackAlert } from '../integration-api/slack/send-quant-test-alert';
import { QuantTestExecutionResultDto } from './quant-test-execution-result-dto';
import { CreateQuantTestResult } from '../quant-test-result/create-quant-test-result';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import { GenerateChart } from './generate-chart';
import BaseAuth from '../services/base-auth';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export type HandleQuantTestExecutionResultRequestDto =
  QuantTestExecutionResultDto;

export interface HandleQuantTestExecutionResultAuthDto {
  isSystemInternal: boolean;
  jwt: string;
}

export type HandleQuantTestExecutionResultResponseDto = Result<null>;

export class HandleQuantTestExecutionResult
  implements
    IUseCase<
      HandleQuantTestExecutionResultRequestDto,
      HandleQuantTestExecutionResultResponseDto,
      HandleQuantTestExecutionResultAuthDto,
      IDbConnection
    >
{
  readonly #sendQuantTestSlackAlert: SendQuantTestSlackAlert;

  readonly #createQuantTestResult: CreateQuantTestResult;

  readonly #generateChart: GenerateChart;

  readonly #querySnowflake: QuerySnowflake;

  constructor(
    sendQuantTestSlackAlert: SendQuantTestSlackAlert,
    createQuantTestResult: CreateQuantTestResult,
    generateChart: GenerateChart,
    querySnowflake: QuerySnowflake
  ) {
    this.#sendQuantTestSlackAlert = sendQuantTestSlackAlert;
    this.#createQuantTestResult = createQuantTestResult;
    this.#generateChart = generateChart;
    this.#querySnowflake = querySnowflake;
  }

  #sendAlert = async (
    testExecutionResult: QuantTestExecutionResultDto,
    auth: BaseAuth,
    connPool: IConnectionPool
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const generateChartRes = await this.#generateChart.execute(
      { testSuiteId: testExecutionResult.testSuiteId },
      auth,
      connPool
    );

    if (!generateChartRes.success) throw new Error(generateChartRes.error);
    if (!generateChartRes.value)
      throw new Error('Missing gen chart response value');

    const alertDto: QuantTestAlertDto = {
      alertId: testExecutionResult.alertData.alertId,
      testType: testExecutionResult.testType,
      detectedOn: testExecutionResult.testData.executedOn,
      deviation: testExecutionResult.testData.deviation,
      expectedLowerBound: testExecutionResult.alertData.expectedLowerBound,
      expectedUpperBound: testExecutionResult.alertData.expectedUpperBound,
      databaseName: testExecutionResult.alertData.databaseName,
      schemaName: testExecutionResult.alertData.schemaName,
      materializationName: testExecutionResult.alertData.materializationName,
      columnName: testExecutionResult.alertData.columnName,
      message: testExecutionResult.alertData.message,
      value: testExecutionResult.alertData.value,
      resourceId: testExecutionResult.targetResourceId,
      chartUrl: generateChartRes.value,
    };

    const sendSlackAlertResult = await this.#sendQuantTestSlackAlert.execute(
      { alertDto, targetOrgId: testExecutionResult.organizationId },
      { jwt }
    );

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

  #createTestResult = async (
    testExecutionResult: QuantTestExecutionResultDto,
    dbConn: IDbConnection
  ): Promise<void> => {
    const { testData } = testExecutionResult;

    if (!testData && !testExecutionResult.isWarmup)
      throw new Error('Test result data misalignment');

    const createQuantTestResultResult =
      await this.#createQuantTestResult.execute(
        {
          isWarmup: testExecutionResult.isWarmup,
          executionId: testExecutionResult.executionId,
          testData,
          alertData: testExecutionResult.alertData
            ? { alertId: testExecutionResult.alertData.alertId }
            : undefined,
          testSuiteId: testExecutionResult.testSuiteId,
          targetResourceId: testExecutionResult.targetResourceId,
          targetOrgId: testExecutionResult.organizationId,
        },
        null,
        dbConn
      );

    if (!createQuantTestResultResult.success)
      throw new Error(createQuantTestResultResult.error);
  };

  async execute(
    req: HandleQuantTestExecutionResultRequestDto,
    auth: HandleQuantTestExecutionResultAuthDto,
    db: IDb
  ): Promise<HandleQuantTestExecutionResultResponseDto> {
    try {
      await this.#createTestResult(req, db.mongoConn);

      if (!req.testData || (!req.testData.isAnomolous && !req.alertData))
        return Result.ok();

      await this.#sendAlert(req, auth.jwt);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
