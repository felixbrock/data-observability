import { MaterializationType, parseMaterializationType } from '../value-types/materialization-type';
import { BaseAnomalyTestSuite } from '../value-types/transient-types/base-test-suite';

export interface TestTarget {
  targetResourceId: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
}

export const matTestTypes = [
  'MaterializationRowCount',
  'MaterializationColumnCount',
  'MaterializationFreshness',
];

export const columnTestTypes = [
  'ColumnFreshness',
  'ColumnCardinality',
  'ColumnUniqueness',
  'ColumnNullness',
  'ColumnDistribution',
] as const;

export type TestType =
  | typeof columnTestTypes[number]
  | typeof matTestTypes[number];

export const parseTestType = (testType: unknown): TestType => {
  const identifiedElement = matTestTypes
    .concat(columnTestTypes)
    .find((element) => element === testType);
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface TestSuiteProperties extends BaseAnomalyTestSuite {
  type: TestType;
  target: TestTarget;
}

export interface TestSuiteDto {
  id: string;
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  target: TestTarget;
  organizationId: string;
}

export class TestSuite implements BaseAnomalyTestSuite {
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
    const { type, target, ...remainingProps } = props;

    if (!remainingProps.id) throw new TypeError('TestSuite must have id');
    if (!remainingProps.organizationId)
      throw new TypeError('TestSuite must have organization id');
    if (matTestTypes.includes(type) && target.columnName)
      throw new SyntaxError(
        'Column name provision only allowed for column level tests'
      );

    const parsedType = parseTestType(type);
    const parsedMaterializationType = parseMaterializationType(
      target.materializationType
    );

    return new TestSuite({
      ...props,
      type: parsedType,
      target: {
        ...target,
        materializationType: parsedMaterializationType,
      },
    });
  };

  toDto = (): TestSuiteDto => ({
    id: this.#id,
    activated: this.#activated,
    type: this.#type,
    threshold: this.#threshold,
    executionFrequency: this.#executionFrequency,
    target: this.#target,
    organizationId: this.#organizationId,
  });
}
