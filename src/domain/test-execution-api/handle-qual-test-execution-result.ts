// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import { QualTestAlertDto } from '../integration-api/slack/qual-test-alert-dto';
import { SendQualTestSlackAlert } from '../integration-api/slack/send-qual-test-alert';
import { QualTestExecutionResultDto } from './qual-test-execution-result-dto';
import { CreateQualTestResult } from '../qual-test-result/create-qual-test-result';

export type HandleQualTestExecutionResultRequestDto = QualTestExecutionResultDto;

export interface HandleQualTestExecutionResultAuthDto {
  isSystemInternal: boolean,
  jwt: string;
}

export type HandleQualTestExecutionResultResponseDto = Result<null>;

export class HandleQualTestExecutionResult
  implements
    IUseCase<
      HandleQualTestExecutionResultRequestDto,
      HandleQualTestExecutionResultResponseDto,
      HandleQualTestExecutionResultAuthDto,
      IDbConnection
    >
{
  readonly #sendQualTestSlackAlert: SendQualTestSlackAlert;

  readonly #createQualTestResult: CreateQualTestResult;

  #dbConnection: IDbConnection;

  constructor(
    sendQualTestSlackAlert: SendQualTestSlackAlert,
    createQualTestResult: CreateQualTestResult
  ) {
    this.#sendQualTestSlackAlert = sendQualTestSlackAlert;
    this.#createQualTestResult = createQualTestResult;
  }

  #sendAlert = async (
    testExecutionResult: QualTestExecutionResultDto,
    jwt: string
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const alertDto: QualTestAlertDto = {
      alertId: testExecutionResult.alertData.alertId,
      testType: testExecutionResult.testType,
      detectedOn: testExecutionResult.testData.executedOn,
      databaseName: testExecutionResult.alertData.databaseName,
      schemaName: testExecutionResult.alertData.schemaName,
      materializationName: testExecutionResult.alertData.materializationName,
      message: testExecutionResult.alertData.message,
      resourceId: testExecutionResult.targetResourceId,
      schemaDiffs: testExecutionResult.testData.schemaDiffs,
    };

    const sendSlackAlertResult = await this.#sendQualTestSlackAlert.execute(
      { alertDto, targetOrgId: testExecutionResult.organizationId },
      { jwt }
    );

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

  #createTestResult = async (
    testExecutionResult: QualTestExecutionResultDto
  ): Promise<void> => {
    const createQualTestResultResult = await this.#createQualTestResult.execute(
      {
        executionId: testExecutionResult.executionId,
        testData: testExecutionResult.testData,
        alertData: testExecutionResult.alertData
          ? { alertId: testExecutionResult.alertData.alertId }
          : undefined,
        testSuiteId: testExecutionResult.testSuiteId,
        testType: testExecutionResult.testType,
        targetResourceId: testExecutionResult.targetResourceId,
        targetOrgId: testExecutionResult.organizationId,
      },
      null,
      this.#dbConnection
    );

    if (!createQualTestResultResult.success)
      throw new Error(createQualTestResultResult.error);
  };

  async execute(
    req: HandleQualTestExecutionResultRequestDto,
    auth: HandleQualTestExecutionResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<HandleQualTestExecutionResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      await this.#createTestResult(req);

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
