// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDb, IDbConnection } from '../services/i-db';
import { QualTestAlertDto } from '../integration-api/slack/qual-test-alert-dto';
import { SendQualTestSlackAlert } from '../integration-api/slack/send-qual-test-alert';
import { QualTestExecutionResultDto } from './qual-test-execution-result-dto';
import { CreateQualTestResult } from '../qual-test-result/create-qual-test-result';
import { QualTestType } from '../entities/qual-test-suite';

export type HandleQualTestExecutionResultRequestDto =
  QualTestExecutionResultDto;

export interface HandleQualTestExecutionResultAuthDto {
  isSystemInternal: boolean;
  jwt: string;
}

export type HandleQualTestExecutionResultResponseDto = Result<null>;

export class HandleQualTestExecutionResult
  implements
    IUseCase<
      HandleQualTestExecutionResultRequestDto,
      HandleQualTestExecutionResultResponseDto,
      HandleQualTestExecutionResultAuthDto,
      IDb
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

  #explain = (
    testType: QualTestType,
    target: { type: 'materialization' | 'column'; templateUrl: string }
  ): string => {
    const targetIdentifier = `${target.type} ${target.templateUrl}`;
    const explanationPrefix = `in ${targetIdentifier} detected`;

    switch (testType) {
      case 'MaterializationSchemaChange':
        return `Schema change ${explanationPrefix}.`;
      default:
        throw new Error('Received unexpected qual test type');
    }
  };

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
      message: this.#explain(testExecutionResult.testType, {
        type: 'materialization',
        templateUrl: testExecutionResult.alertData.message,
      }),
      resourceId: testExecutionResult.targetResourceId,
      deviations: testExecutionResult.testData.deviations,
    };

    const sendSlackAlertResult = await this.#sendQualTestSlackAlert.execute({
      req: { alertDto, targetOrgId: testExecutionResult.organizationId },
      auth: { jwt },
    });

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
        req: {
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
        dbConnection: this.#dbConnection,
      }
    );

    if (!createQualTestResultResult.success)
      throw new Error(createQualTestResultResult.error);
  };

  async execute(props: {
    req: HandleQualTestExecutionResultRequestDto;
    auth: HandleQualTestExecutionResultAuthDto;
    db: IDb;
  }): Promise<HandleQualTestExecutionResultResponseDto> {
    const { req, auth, db } = props;

    try {
      this.#dbConnection = db.mongoConn;

      await this.#createTestResult(req);

      if (!req.testData || (req.testData.isIdentical && !req.alertData))
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
