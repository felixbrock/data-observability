// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import { CustomTestExecutionResultDto } from './custom-test-execution-result-dto';
import { GenerateChart } from '../integration-api/slack/chart/generate-chart';
import { ThresholdType } from '../snowflake-api/post-anomaly-feedback';
import { CustomTestAlertDto } from '../integration-api/slack/custom-test-alert-dto';
import { SendCustomTestSlackAlert } from '../integration-api/slack/send-custom-test-alert';

export type HandleCustomTestExecutionResultRequestDto =
  CustomTestExecutionResultDto;

export interface HandleCustomTestExecutionResultAuthDto {
  isSystemInternal: boolean;
  jwt: string;
}

export type HandleCustomTestExecutionResultResponseDto = Result<null>;

export class HandleCustomTestExecutionResult
  implements
    IUseCase<
      HandleCustomTestExecutionResultRequestDto,
      HandleCustomTestExecutionResultResponseDto,
      HandleCustomTestExecutionResultAuthDto,
      IDbConnection
    >
{
  readonly #sendCustomTestSlackAlert: SendCustomTestSlackAlert;

  readonly #generateChart: GenerateChart;

  #dbConnection?: IDbConnection;

  constructor(
    sendCustomTestSlackAlert: SendCustomTestSlackAlert,
    generateChart: GenerateChart
  ) {
    this.#sendCustomTestSlackAlert = sendCustomTestSlackAlert;
    this.#generateChart = generateChart;
  }

  #explain = (
    name: string,
    value: number,
    deviation: number,
    expectedValue: number,
  ): string => {
    const fixedValue = value % 1 !== 0 ? value.toFixed(4) : value;
    const fixedDeviation =
      deviation % 1 !== 0 ? (deviation * 100).toFixed(2) : deviation * 100;
    const fixedExpectedValue =
      expectedValue % 1 !== 0 ? expectedValue.toFixed(4) : expectedValue;
    
    const buildAnomalyExplanation = (characteristic: string): string =>
      `That's unusually ${characteristic}, with a deviation of ${fixedDeviation}% based on an expected average value of ${fixedExpectedValue}`;

    return `A value of ${fixedValue} was detected for the test ${name}. ${buildAnomalyExplanation(
        deviation >= 0 ? 'high' : 'low'
    )}.`;
  };

  #buildDeviaton = (decimalDeviation: number): string =>
    decimalDeviation % 1 !== 0
      ? (decimalDeviation * 100).toFixed(2)
      : (decimalDeviation * 100).toString();

  #sendAlert = async (
    testExecutionResult: CustomTestExecutionResultDto,
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

    const alertDto: CustomTestAlertDto = {
      alertId: testExecutionResult.alertData.alertId,
      testType: testExecutionResult.testType,
      name: testExecutionResult.name,
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
      message: this.#explain(
        testExecutionResult.name,
        testExecutionResult.testData.detectedValue,
        testExecutionResult.testData.deviation,
        testExecutionResult.alertData.expectedValue,
      ),
      detectedValue: testExecutionResult.testData.detectedValue.toString(),
      thresholdType,
      chartUrl: generateChartRes.value.url,
      testSuiteId: testExecutionResult.testSuiteId,
    };

    const sendSlackAlertResult = await this.#sendCustomTestSlackAlert.execute({
      req: { alertDto, targetOrgId: testExecutionResult.organizationId },
      auth: { jwt },
    });

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

  #sleepModeActive = (lastAlertSent: string): boolean => {
    const lastAlertTimestamp = new Date(lastAlertSent);
    const now = new Date();
    const timeElapsedMillis = now.getTime() - lastAlertTimestamp.getTime();
    const timeElapsedHrs = timeElapsedMillis / (1000 * 60 * 60);

    return timeElapsedHrs < 24;
  };

  async execute(props: {
    req: HandleCustomTestExecutionResultRequestDto;
    auth: HandleCustomTestExecutionResultAuthDto;
    dbConnection: IDbConnection;
  }): Promise<HandleCustomTestExecutionResultResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      this.#dbConnection = dbConnection;

      if (req.lastAlertSent && this.#sleepModeActive(req.lastAlertSent)) {
        console.log(
          `Sleep mode active. Not sending alert for ${req.executionId}`
        );
        return Result.ok();
      }

      if (!req.testData || (!req.testData.anomaly && !req.alertData) || 
        (req.testData.anomaly && !req.alertData))
        
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