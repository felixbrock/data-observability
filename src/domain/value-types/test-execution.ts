import { DataValidationResultDto } from "../data-validation-api/i-data-validation-api-repo";

export type DataValidationResult = DataValidationResultDto

export interface TestExecutionProperties {
  testSuiteId: string;
  dataValidationResult: DataValidationResult;
}

export class TestExecution {
  #testSuiteId: string;

  #dataValidationResult: DataValidationResult;

  get testSuiteId(): string {
    return this.#testSuiteId;
  }

  get dataValidationResult(): DataValidationResult {
    return this.#dataValidationResult;
  }

  private constructor(props: TestExecutionProperties) {
    this.#testSuiteId = props.testSuiteId;
    this.#dataValidationResult = props.dataValidationResult;
  }

  static create = (
    props: TestExecutionProperties
  ): TestExecution => {
    if (!props.testSuiteId)
      throw new TypeError('TestExecution must have test suite');
    if (!props.dataValidationResult)
      throw new TypeError('TestExecution must have data validation result');

    const testExecution = new TestExecution({ ...props });

    return testExecution;
  };
}
