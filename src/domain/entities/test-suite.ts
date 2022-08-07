export const materializationTypes = ['Table', 'View'] as const;
export type MaterializationType = typeof materializationTypes[number];

export const parseMaterializationType = (
  materializationType: unknown
): MaterializationType => {
  const identifiedElement = materializationTypes.find(
    (element) => element === materializationType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export const testTypes = [
  'ColumnFreshness',
  'ColumnCardinality',
  'ColumnUniqueness',
  'ColumnNullness',
  'ColumnDistribution',
  'MaterializationRowCount',
  'MaterializationColumnCount',
  'MaterializationFreshness',
] as const;
export type TestType = typeof testTypes[number];

export const parseTestType = (testType: unknown): TestType => {
  const identifiedElement = testTypes.find((element) => element === testType);
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface TestSuiteProperties {
  id: string;
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
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

  #databaseName: string;

  #schemaName: string;

  #materializationName: string;

  #columnName?: string;

  #materializationType: MaterializationType;

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

  get databaseName(): string {
    return this.#databaseName;
  }

  get schemaName(): string {
    return this.#schemaName;
  }

  get materializationName(): string {
    return this.#materializationName;
  }

  get columnName(): string | undefined {
    return this.#columnName;
  }

  get materializationType(): MaterializationType {
    return this.#materializationType;
  }

  private constructor(props: TestSuiteProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#threshold = props.threshold;
    this.#executionFrequency = props.executionFrequency;
    this.#databaseName = props.databaseName;
    this.#schemaName = props.schemaName;
    this.#materializationName = props.materializationName;
    this.#materializationType = props.materializationType;
    this.#columnName = props.columnName;
  }

  static create = (props: TestSuiteProperties): TestSuite => {
    if (!props.id) throw new TypeError('TestSuite must have id');
    if (!props.organizationId)
      throw new TypeError('TestSuite must have organization id');
    if (!props.type) throw new TypeError('TestSuite must have type');
    if (!props.databaseName)
      throw new TypeError('TestSuite must have databaseName');
    if (!props.schemaName)
      throw new TypeError('TestSuite must have schemaName');
    if (!props.materializationName)
      throw new TypeError('TestSuite must have materializationName');

    return new TestSuite(props);
  };
}
