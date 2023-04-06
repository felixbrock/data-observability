import { ExecutionType } from '../value-types/execution-type';
import {
  MaterializationType,
  parseMaterializationType,
} from '../value-types/materialization-type';
import { BaseTestSuite } from '../value-types/transient-types/base-test-suite';

export interface TestTarget {
  targetResourceId: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
}

export const qualMatTestTypes = ['MaterializationSchemaChange'] as const;

export const qualColumnTestTypes = [] as const;

export type QualTestType =
  | typeof qualMatTestTypes[number]
  | typeof qualColumnTestTypes[number];

export const parseQualTestType = (testType: unknown): QualTestType => {
  const identifiedElement = qualMatTestTypes
    .concat(qualColumnTestTypes)
    .find((element) => element === testType);
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface QualTestSuiteProps extends BaseTestSuite {
  type: QualTestType;
  target: TestTarget;
}

export interface QualTestSuiteDto {
  id: string;
  activated: boolean;
  type: QualTestType;
  target: TestTarget;
  cron: string;
  executionType: ExecutionType;
  deletedAt?: string;
  lastAlertSent?: string;
}

export class QualTestSuite {
  #id: string;

  #activated: boolean;

  #type: QualTestType;

  #target: TestTarget;

  #cron: string;

  #executionType: ExecutionType;

  #deletedAt?: string;

  #lastAlertSent?: string;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get type(): QualTestType {
    return this.#type;
  }

  get target(): TestTarget {
    return this.#target;
  }

  get cron(): string {
    return this.#cron;
  }

  get executionType(): ExecutionType {
    return this.#executionType;
  }

  get deletedAt(): string | undefined {
    return this.#deletedAt;
  }

  get lastAlertSent(): string | undefined {
    return this.#lastAlertSent;
  }

  private constructor(props: QualTestSuiteProps) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#target = props.target;
    this.#cron = props.cron;
    this.#executionType = props.executionType;
    this.#deletedAt = props.deletedAt;
    this.#lastAlertSent = props.lastAlertSent;
  }

  static create = (props: QualTestSuiteProps): QualTestSuite => {
    const { type, target, ...remainingProps } = props;

    if (!remainingProps.id) throw new TypeError('TestSuite must have id');
    if (!remainingProps.cron) throw new TypeError('TestSuite must have cron');
    if (!remainingProps.executionType)
      throw new TypeError('Test suite must have execution type');
    if (qualMatTestTypes.includes(type) && target.columnName)
      throw new SyntaxError(
        'Column name provision only allowed for column level tests'
      );

    const parsedType = parseQualTestType(type);
    const parsedMaterializationType = parseMaterializationType(
      target.materializationType
    );

    return new QualTestSuite({
      ...props,
      type: parsedType,
      target: {
        ...target,
        materializationType: parsedMaterializationType,
      },
    });
  };

  toDto = (): QualTestSuiteDto => ({
    id: this.#id,
    activated: this.#activated,
    type: this.#type,
    target: this.#target,
    cron: this.#cron,
    executionType: this.#executionType,
    deletedAt: this.#deletedAt,
    lastAlertSent: this.#lastAlertSent,
  });
}
