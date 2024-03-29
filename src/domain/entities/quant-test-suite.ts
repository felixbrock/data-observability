import { CustomThresholdMode } from '../value-types/custom-threshold-mode';
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

  #customUpperThreshold?: number;

  #customLowerThreshold?: number;

  #customUpperThresholdMode: CustomThresholdMode;

  #customLowerThresholdMode: CustomThresholdMode;

  #cron: string;

  #executionType: ExecutionType;

  #feedbackUpperThreshold?: number;

  #feedbackLowerThreshold?: number;

  #deletedAt?: string;

  #lastAlertSent?: string;

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

  get customUpperThreshold(): number | undefined {
    return this.#customUpperThreshold;
  }

  get customLowerThreshold(): number | undefined {
    return this.#customLowerThreshold;
  }

  get customUpperThresholdMode(): CustomThresholdMode {
    return this.#customUpperThresholdMode;
  }

  get customLowerThresholdMode(): CustomThresholdMode {
    return this.#customLowerThresholdMode;
  }

  get cron(): string {
    return this.#cron;
  }

  get executionType(): ExecutionType {
    return this.#executionType;
  }

  get feedbackUpperThreshold(): number | undefined {
    return this.#feedbackUpperThreshold;
  }

  get feedbackLowerThreshold(): number | undefined {
    return this.#feedbackLowerThreshold;
  }

  get deletedAt(): string | undefined {
    return this.#deletedAt;
  }

  get lastAlertSent(): string | undefined {
    return this.#lastAlertSent;
  }

  private constructor(props: TestSuiteProps) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#type = props.type;

    this.#customLowerThreshold = props.customLowerThreshold;
    this.#customUpperThreshold = props.customUpperThreshold;
    this.#customLowerThresholdMode = props.customLowerThresholdMode;
    this.#customUpperThresholdMode = props.customUpperThresholdMode;

    this.#target = props.target;
    this.#cron = props.cron;
    this.#executionType = props.executionType;
    this.#feedbackLowerThreshold = props.feedbackLowerThreshold;
    this.#feedbackUpperThreshold = props.feedbackUpperThreshold;
    this.#deletedAt = props.deletedAt;
    this.#lastAlertSent = props.lastAlertSent;
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
    customLowerThreshold: this.#customLowerThreshold,
    customUpperThreshold: this.#customUpperThreshold,
    customLowerThresholdMode: this.#customLowerThresholdMode,
    customUpperThresholdMode: this.#customUpperThresholdMode,
    target: this.#target,
    cron: this.#cron,
    executionType: this.#executionType,
    feedbackLowerThreshold: this.#feedbackLowerThreshold,
    feedbackUpperThreshold: this.#feedbackUpperThreshold,
    deletedAt: this.#deletedAt,
    lastAlertSent: this.#lastAlertSent,
  });
}
