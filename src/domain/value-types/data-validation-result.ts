export type TestEngineResult = { [key: string | number | symbol]: unknown };

export interface DataValidationResultProperties {
  testSuiteId: string;
  testEngineResult: TestEngineResult;
}

export class DataValidationResult {
  #testSuiteId: string;

  #testEngineResult: TestEngineResult;

  get testSuiteId(): string {
    return this.#testSuiteId;
  }

  get testEngineResult(): TestEngineResult {
    return this.#testEngineResult;
  }

  private constructor(props: DataValidationResultProperties) {
    this.#testSuiteId = props.testSuiteId;
    this.#testEngineResult = props.testEngineResult;
  }

  static create = (
    props: DataValidationResultProperties
  ): DataValidationResult => {
    if (!props.testSuiteId)
      throw new TypeError('DataValidationResult must have test suite');
    if (!props.testEngineResult)
      throw new TypeError('DataValidationResult must have test engine result');

    const dataValidationResult = new DataValidationResult({ ...props });

    return dataValidationResult;
  };
}
