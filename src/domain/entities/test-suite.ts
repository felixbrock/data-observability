export const testTypes = [
  'ColumnFreshness',
  'ColumnCardinality',
  'ColumnUniqueness',
  'ColumnNullness',
  'ColumnSortednessIncreasing',
  'ColumnSortednessDecreasing',
  'ColumnDistribution',
  'MaterializationRowCount',
  'MaterializationColumnCount',
  'MaterializationFreshness',
] as const;
export type TestType = typeof testTypes[number];

export const parseTestType = (testType: unknown): TestType => {
  const identifiedFrequency = testTypes.find((element) => element === testType);
  if (identifiedFrequency) return identifiedFrequency;
  throw new Error('Provision of invalid test type');
};

export interface TestSuiteProperties {
  id: string;
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  materializationAddress: string;
  columnName?: string;
  organizationId: string;
}

export class TestSuite {
  #id: string;

  #organizationId: string;

  #activated: boolean;

  #type: TestType;

  #threshold: number;

  #executionFrequency: number;

  #materializationAddress: string;

  #columnName?: string;

  get id(): string {
    return this.#id;
  }

  get organizationId(): string {
    return this.#organizationId;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get type(): TestType {
    return this.#type;
  }

  get threshold(): number {
    return this.#threshold;
  }

  get executionFrequency(): number {
    return this.#executionFrequency;
  }

  get materializationAddress(): string {
    return this.#materializationAddress;
  }

  get columnName(): string | undefined {
    return this.#columnName;
  }

  private constructor(props: TestSuiteProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#threshold = props.threshold;
    this.#executionFrequency = props.executionFrequency;
    this.#materializationAddress = props.materializationAddress;
    this.#columnName = props.columnName;
  }

  static create = (props: TestSuiteProperties): TestSuite => {
    if (!props.id) throw new TypeError('TestSuite must have id');
    if (!props.organizationId)
      throw new TypeError('TestSuite must have organization id');
    if (!props.type) throw new TypeError('Expectation must have type');
    if (!props.materializationAddress)
      throw new TypeError('Expectation must have materializationAddress');

    return new TestSuite(props);
  };
}
