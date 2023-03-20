// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDb, IDbConnection } from '../services/i-db';
import { QuantTestAlertDto } from '../integration-api/slack/quant-test-alert-dto';
import { SendQuantTestSlackAlert } from '../integration-api/slack/send-quant-test-alert';
import { QuantTestExecutionResultDto } from './quant-test-execution-result-dto';
import { CreateQuantTestResult } from '../quant-test-result/create-quant-test-result';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { GenerateChart } from '../integration-api/slack/chart/generate-chart';
import { TestType } from '../entities/quant-test-suite';

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

  constructor(
    sendQuantTestSlackAlert: SendQuantTestSlackAlert,
    createQuantTestResult: CreateQuantTestResult,
    generateChart: GenerateChart
  ) {
    this.#sendQuantTestSlackAlert = sendQuantTestSlackAlert;
    this.#createQuantTestResult = createQuantTestResult;
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
      `That's unusually ${characteristic}, with a deviation of ${fixedDeviation}% based on an expected average value of ${fixedExpectedValue}`;

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
          deviation >= 0 ? 'early' : 'late'
        )}.`;
      case 'ColumnFreshness':
        return `The most recent timestamp in ${targetIdentifier} is representing an event that occurred ${fixedValue} min ago. ${buildAnomalyExplanation(
          deviation >= 0 ? 'early' : 'late'
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
        return `An average value of ${fixedValue} was detected for ${targetIdentifier}. ${buildAnomalyExplanation(
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
    connPool: IConnectionPool
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.testData.anomaly.importance)
      throw new Error('Missing anomaly importance. Cannot send anomaly alert');
    if (!testExecutionResult.testData.anomaly.boundsIntervalRelative)
      throw new Error(
        'Missing anomaly boundsIntervalRelative. Cannot send anomaly alert'
      );
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const generateChartRes = await this.#generateChart.execute({
      req: { testSuiteId: testExecutionResult.testSuiteId },
      connPool,
    });

    if (!generateChartRes.success) throw new Error(generateChartRes.error);
    if (!generateChartRes.value)
      throw new Error('Missing gen chart response value');

    const alertDto: QuantTestAlertDto = {
      alertId: testExecutionResult.alertData.alertId,
      testType: testExecutionResult.testType,
      detectedOn: testExecutionResult.testData.executedOn,
      deviation: this.#buildDeviaton(testExecutionResult.testData.deviation),
      expectedLowerBound:
        testExecutionResult.alertData.expectedLowerBound % 1 !== 0
          ? testExecutionResult.alertData.expectedLowerBound.toFixed(4)
          : testExecutionResult.alertData.expectedLowerBound.toString(),
      expectedUpperBound:
        testExecutionResult.alertData.expectedUpperBound % 1 !== 0
          ? testExecutionResult.alertData.expectedUpperBound.toFixed(4)
          : testExecutionResult.alertData.expectedUpperBound.toString(),
      databaseName: testExecutionResult.alertData.databaseName,
      schemaName: testExecutionResult.alertData.schemaName,
      materializationName: testExecutionResult.alertData.materializationName,
      columnName: testExecutionResult.alertData.columnName,
      message: this.#explain(
        testExecutionResult.testType,
        testExecutionResult.alertData.value,
        testExecutionResult.testData.deviation,
        testExecutionResult.alertData.expectedValue,
        {
          type: testExecutionResult.alertData.columnName
            ? 'column'
            : 'materialization',
          templateUrl: testExecutionResult.alertData.message,
        }
      ),
      value:
        testExecutionResult.alertData.value % 1 !== 0
          ? testExecutionResult.alertData.value.toFixed(4)
          : testExecutionResult.alertData.value.toString(),
      targetResourceId: testExecutionResult.targetResourceId,
      chartUrl: generateChartRes.value.url,
      importance:
        testExecutionResult.testData.anomaly.importance % 1 !== 0
          ? testExecutionResult.testData.anomaly.importance.toFixed(4)
          : testExecutionResult.testData.anomaly.importance.toString(),
      boundsIntervalRelative:
        testExecutionResult.testData.anomaly.boundsIntervalRelative % 1 !== 0
          ? testExecutionResult.testData.anomaly.boundsIntervalRelative.toFixed(
              4
            )
          : testExecutionResult.testData.anomaly.boundsIntervalRelative.toString(),
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

  #createTestResult = async (
    testExecutionResult: QuantTestExecutionResultDto,
    dbConn: IDbConnection
  ): Promise<void> => {
    const { testData } = testExecutionResult;

    if (!testData && !testExecutionResult.isWarmup)
      throw new Error('Test result data misalignment');

    const createQuantTestResultResult =
      await this.#createQuantTestResult.execute({
        req: {
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
        dbConnection: dbConn,
      });

    if (!createQuantTestResultResult.success)
      throw new Error(createQuantTestResultResult.error);
  };

  async execute(props: {
    req: HandleQuantTestExecutionResultRequestDto;
    auth: HandleQuantTestExecutionResultAuthDto;
    db: IDb;
  }): Promise<HandleQuantTestExecutionResultResponseDto> {
    const { req, auth, db } = props;

    try {
      await this.#createTestResult(req, db.mongoConn);

      if (!req.testData || (!req.testData.anomaly.isAnomaly && !req.alertData))
        return Result.ok();

      console.log('Anomaly detected, sending alert');

      await this.#sendAlert(req, auth.jwt, db.sfConnPool);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
