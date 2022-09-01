import { BaseTestSuite } from '../value-types/transient-types/base-test-suite';

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

export interface TestTarget {
  targetResourceId: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
}

export const testTypes = [
  'ColumnFreshness',
  'ColumnCardinality',
  'ColumnUniqueness',
  'ColumnNullness',
  'ColumnDistribution',
  'MaterializationRowCount',
  'MaterializationColumnCount',
  'MaterializationFreshness',
  // 'TestTemplate'
] as const;
export type TestType = typeof testTypes[number];

export const parseTestType = (testType: unknown): TestType => {
  const identifiedElement = testTypes.find((element) => element === testType);
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface TestSuiteProperties extends BaseTestSuite{
  type: TestType;
  target: TestTarget;
  // template?: TestTemplate
}

export class TestSuite implements BaseTestSuite{
  #id: string;

  #organizationId: string;

  #activated: boolean;

  #type: TestType;

  #target: TestTarget;

  #threshold: number;

  #executionFrequency: number;

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

  get target(): TestTarget {
    return this.#target;
  }

  get threshold(): number {
    return this.#threshold;
  }

  get executionFrequency(): number {
    return this.#executionFrequency;
  }

  private constructor(props: TestSuiteProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#threshold = props.threshold;
    this.#executionFrequency = props.executionFrequency;
    this.#target = props.target;
  }

  static create = (props: TestSuiteProperties): TestSuite => {
    if (!props.id) throw new TypeError('TestSuite must have id');
    if (!props.organizationId)
      throw new TypeError('TestSuite must have organization id');

    return new TestSuite(props);
  };
}
