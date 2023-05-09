// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import { QuantTestAlertDto } from '../integration-api/slack/quant-test-alert-dto';
import { SendQuantTestSlackAlert } from '../integration-api/slack/send-quant-test-alert';
import { QuantTestExecutionResultDto } from './quant-test-execution-result-dto';
import { GenerateChart } from '../integration-api/slack/chart/generate-chart';
import { TestType } from '../entities/quant-test-suite';
import { ThresholdType } from '../snowflake-api/post-anomaly-feedback';

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

  readonly #generateChart: GenerateChart;

  #dbConnection?: IDbConnection;

  constructor(
    sendQuantTestSlackAlert: SendQuantTestSlackAlert,
    generateChart: GenerateChart
  ) {
    this.#sendQuantTestSlackAlert = sendQuantTestSlackAlert;
    this.#generateChart = generateChart;
  }

  #explain = (
    testType: TestType,
    value: number,
    deviation: number,
    expectedValue: number,
    target: { type: 'materialization' | 'column'; templateUrl: string }
  ): string => {
    const fixedValue = value % 1 !== 0 ? value.toFixed(4) : value;
    const fixedDeviation =
      deviation % 1 !== 0 ? (deviation * 100).toFixed(2) : deviation * 100;
    const fixedExpectedValue =
      expectedValue % 1 !== 0 ? expectedValue.toFixed(4) : expectedValue;

    const targetIdentifier = `${target.type} ${target.templateUrl}`;
    const explanationPrefix = `in ${targetIdentifier} detected`;
    const buildAnomalyExplanation = (characteristic: string): string =>
      `That's unusually ${characteristic}, with a deviation of ${fixedDeviation}% based on an expected average median value of ${fixedExpectedValue}`;

    switch (testType) {
      case 'MaterializationRowCount':
        return `${fixedExpectedValue} rows ${explanationPrefix}. ${buildAnomalyExplanation(
          deviation >= 0 ? 'high' : 'low'
        )}.`;
      case 'MaterializationColumnCount':
        return `${fixedValue} columns ${explanationPrefix}. ${buildAnomalyExplanation(
          deviation >= 0 ? 'high' : 'low'
        )}.`;
      case 'MaterializationFreshness':
        return `${
          targetIdentifier[0].toUpperCase() + targetIdentifier.slice(1)
        } was modified ${fixedValue} minutes ago. ${buildAnomalyExplanation(
          deviation >= 0 ? 'long ago' : 'recent'
        )}.`;
      case 'ColumnFreshness':
        return `The most recent timestamp in ${targetIdentifier} is representing an event that occurred ${fixedValue} min ago. ${buildAnomalyExplanation(
          deviation >= 0 ? 'long ago' : 'recent'
        )}.`;
      case 'ColumnCardinality':
        return `${fixedValue} unique values ${explanationPrefix}. ${buildAnomalyExplanation(
          deviation >= 0 ? 'high' : 'low'
        )}.`;
      case 'ColumnUniqueness':
        return `${
          targetIdentifier[0].toUpperCase() + targetIdentifier.slice(1)
        } holds ${
          value % 1 !== 0 ? (value * 100).toFixed(2) : value * 100
        }% unique values. ${buildAnomalyExplanation(
          deviation >= 0 ? 'high' : 'low'
        )}.`;
      case 'ColumnNullness':
        return `${
          targetIdentifier[0].toUpperCase() + targetIdentifier.slice(1)
        } holds ${
          value % 1 !== 0 ? (value * 100).toFixed(2) : value * 100
        }% null values. ${buildAnomalyExplanation(
          deviation >= 0 ? 'high' : 'low'
        )}`;
      case 'ColumnDistribution':
        return `An average median value of ${fixedValue} was detected for ${targetIdentifier}. ${buildAnomalyExplanation(
          deviation >= 0 ? 'high' : 'low'
        )}.`;
      default:
        throw new Error('Received unexpected quant test type');
    }
  };

  #buildDeviaton = (decimalDeviation: number): string =>
    decimalDeviation % 1 !== 0
      ? (decimalDeviation * 100).toFixed(2)
      : (decimalDeviation * 100).toString();

  #sendAlert = async (
    testExecutionResult: QuantTestExecutionResultDto,
    jwt: string,
    dbConnection: IDbConnection,
    ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.testData.anomaly)
      throw new Error('Missing anomaly data. Cannot send anomaly alert');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const generateChartRes = await this.#generateChart.execute({
      req: { testSuiteId: testExecutionResult.testSuiteId },
      dbConnection,
      callerOrgId: testExecutionResult.organizationId
    });

    if (!generateChartRes.success) throw new Error(generateChartRes.error);
    if (!generateChartRes.value)
      throw new Error('Missing gen chart response value');

    let thresholdType: ThresholdType;
    if (
      testExecutionResult.testData.detectedValue >
      testExecutionResult.testData.expectedUpperBound
    )
      thresholdType = 'upper';
    else if (
      testExecutionResult.testData.detectedValue <
      testExecutionResult.testData.expectedLowerBound
    )
      thresholdType = 'lower';
    else throw new Error('Invalid threshold type');

    const alertDto: QuantTestAlertDto = {
      alertId: testExecutionResult.alertData.alertId,
      testType: testExecutionResult.testType,
      detectedOn: testExecutionResult.testData.executedOn,
      deviation: this.#buildDeviaton(testExecutionResult.testData.deviation),
      expectedLowerBound:
        testExecutionResult.testData.expectedLowerBound % 1 !== 0
          ? testExecutionResult.testData.expectedLowerBound.toFixed(4)
          : testExecutionResult.testData.expectedLowerBound.toString(),
      expectedUpperBound:
        testExecutionResult.testData.expectedUpperBound % 1 !== 0
          ? testExecutionResult.testData.expectedUpperBound.toFixed(4)
          : testExecutionResult.testData.expectedUpperBound.toString(),
      databaseName: testExecutionResult.alertData.databaseName,
      schemaName: testExecutionResult.alertData.schemaName,
      materializationName: testExecutionResult.alertData.materializationName,
      columnName: testExecutionResult.alertData.columnName,
      message: this.#explain(
        testExecutionResult.testType,
        testExecutionResult.testData.detectedValue,
        testExecutionResult.testData.deviation,
        testExecutionResult.alertData.expectedValue,
        {
          type: testExecutionResult.alertData.columnName
            ? 'column'
            : 'materialization',
          templateUrl: testExecutionResult.alertData.message,
        }
      ),
      detectedValue: testExecutionResult.testData.detectedValue.toString(),
      thresholdType,
      targetResourceId: testExecutionResult.targetResourceId,
      chartUrl: generateChartRes.value.url,
      testSuiteId: testExecutionResult.testSuiteId,
    };

    const sendSlackAlertResult = await this.#sendQuantTestSlackAlert.execute({
      req: { alertDto, targetOrgId: testExecutionResult.organizationId },
      auth: { jwt },
    });

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

  // #createTestResult = async (
  //   testExecutionResult: QuantTestExecutionResultDto,
  //   dbConn: IDbConnection
  // ): Promise<void> => {
  //   const { testData } = testExecutionResult;

  //   if (!testData && !testExecutionResult.isWarmup)
  //     throw new Error('Test result data misalignment');

  //   const createQuantTestResultResult =
  //     await this.#createQuantTestResult.execute({
  //       req: {
  //         isWarmup: testExecutionResult.isWarmup,
  //         executionId: testExecutionResult.executionId,
  //         testData,
  //         alertData: testExecutionResult.alertData
  //           ? { alertId: testExecutionResult.alertData.alertId }
  //           : undefined,
  //         testSuiteId: testExecutionResult.testSuiteId,
  //         targetResourceId: testExecutionResult.targetResourceId,
  //         targetOrgId: testExecutionResult.organizationId,
  //       },
  //       dbConnection: dbConn,
  //     });

  //   if (!createQuantTestResultResult.success)
  //     throw new Error(createQuantTestResultResult.error);
  // };

  #sleepModeActive = (lastAlertSent: string): boolean => {
    const lastAlertTimestamp = new Date(lastAlertSent);
    const now = new Date();
    const timeElapsedMillis = now.getTime() - lastAlertTimestamp.getTime();
    const timeElapsedHrs = timeElapsedMillis / (1000 * 60 * 60);

    return timeElapsedHrs < 24;
  };

  async execute(props: {
    req: HandleQuantTestExecutionResultRequestDto;
    auth: HandleQuantTestExecutionResultAuthDto;
    dbConnection: IDbConnection;
  }): Promise<HandleQuantTestExecutionResultResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      this.#dbConnection = dbConnection;

      // await this.#createTestResult(req, dbConnection);

      if (req.lastAlertSent && this.#sleepModeActive(req.lastAlertSent)) {
        console.log(
          `Sleep mode active. Not sending alert for ${req.executionId}`
        );
        return Result.ok();
      }

      if (
        !req.testData ||
        (!req.testData.anomaly && !req.alertData) ||
        (req.testData.anomaly && !req.alertData)
      )
        return Result.ok();

      console.log('Anomaly detected, sending alert');

      await this.#sendAlert(req, auth.jwt, dbConnection);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
