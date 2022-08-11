export interface TestResultProperties {
  testSuiteId: string;
  testType: string;
  executionId: string;
  executedOn: string;
  isAnomolous: boolean;
  threshold: number;
  executionFrequency: number;
  modifiedZScore: number;
  deviation: number;
  alertId?: string;
  targetResourceId: string;
  organizationId: string;
}

export class TestResult {
  #testSuiteId: string;

  #testType: string;

  #executionId: string;

  #executedOn: string;

  #isAnomolous: boolean;

  #threshold: number;

  #executionFrequency: number;

  #modifiedZScore: number;

  #deviation: number;

  #alertId?: string;

  #targetResourceId: string;

  #organizationId: string;

  get testSuiteId(): string {
    return this.#testSuiteId;
  }

  get testType(): string {
    return this.#testType;
  }

  get executionId(): string {
    return this.#executionId;
  }

  get executedOn(): string {
    return this.#executedOn;
  }

  get isAnomolous(): boolean {
    return this.#isAnomolous;
  }

  get threshold(): number {
    return this.#threshold;
  }

  get executionFrequency(): number {
    return this.#executionFrequency;
  }

  get modifiedZScore(): number {
    return this.#modifiedZScore;
  }

  get deviation(): number {
    return this.#deviation;
  }

  get alertId(): string | undefined {
    return this.#alertId;
  }

  get targetResourceId(): string {
    return this.#targetResourceId;
  }

  get organizationId(): string {
    return this.#organizationId;
  }

  private constructor(props: TestResultProperties) {
    this.#testSuiteId = props.testSuiteId;
    this.#testType = props.testType;
    this.#executionId = props.executionId;
    this.#executedOn = props.executedOn;
    this.#isAnomolous = props.isAnomolous;
    this.#threshold = props.threshold;
    this.#executionFrequency = props.executionFrequency;
    this.#modifiedZScore = props.modifiedZScore;
    this.#deviation = props.deviation;
    this.#alertId = props.alertId;
    this.#targetResourceId = props.targetResourceId;
    this.#organizationId = props.organizationId;
  }

  static create = (props: TestResultProperties): TestResult => {
    if (!props.testSuiteId) throw new TypeError('TestResult must have test suite id');
    if (!props.testType)
      throw new TypeError('TestResult must have test type');
    if (!props.executionId) throw new TypeError('TestResult must have execution id');
    if (!props.executedOn) throw new TypeError('TestResult must have executed on');
    if (!props.targetResourceId) throw new TypeError('TestResult must have target resource id');
    if (!props.organizationId) throw new TypeError('TestResult must have organization id');

    return new TestResult(props);
  };
}
