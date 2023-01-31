import { ExecutionType } from '../value-types/execution-type';
import {
  MaterializationType,
  parseMaterializationType,
} from '../value-types/materialization-type';
import { BaseQuantTestSuite } from '../value-types/transient-types/base-test-suite';

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

export interface TestSuiteProps extends BaseQuantTestSuite {
  type: TestType;
  target: TestTarget;
}

export type TestSuiteDto = TestSuiteProps;

export class TestSuite {
  #id: string;

  #activated: boolean;

  #type: TestType;

  #target: TestTarget;

  #threshold: number;

  #cron: string;

  #executionType: ExecutionType;

  #importanceThreshold: number;

  #boundsIntervalRelative: number;

  #deletedAt?: string;

  get id(): string {
    return this.#id;
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

  get cron(): string {
    return this.#cron;
  }

  get executionType(): ExecutionType {
    return this.#executionType;
  }

  get importanceThreshold(): number {
    return this.#importanceThreshold;
  }

  get boundsIntervalRelative(): number {
    return this.#boundsIntervalRelative;
  }

  get deletedAt(): string | undefined {
    return this.#deletedAt;
  }

  private constructor(props: TestSuiteProps) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#threshold = props.threshold;
    this.#target = props.target;
    this.#cron = props.cron;
    this.#executionType = props.executionType;
    this.#importanceThreshold = props.importanceThreshold;
    this.#boundsIntervalRelative = props.boundsIntervalRelative;
    this.#deletedAt = props.deletedAt;
  }

  static create = (props: TestSuiteProps): TestSuite => {
    const { type, target, ...remainingProps } = props;

    if (!remainingProps.id) throw new TypeError('TestSuite must have id');
    if (!remainingProps.cron)
      throw new TypeError('TestSuite must have cron expression');
    if (!remainingProps.executionType)
      throw new TypeError('Test suite must have execution type');
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
    target: this.#target,
    cron: this.#cron,
    executionType: this.#executionType,
    importanceThreshold: this.#importanceThreshold,
    boundsIntervalRelative: this.#boundsIntervalRelative,
    deletedAt: this.#deletedAt,
  });
}
