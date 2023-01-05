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

export const qualitativeMatTestTypes = ['MaterializationSchemaChange'] as const;

export const qualitativeColumnTestTypes = [] as const;

export type QualitativeTestType =
  | typeof qualitativeMatTestTypes[number]
  | typeof qualitativeColumnTestTypes[number];

export const parseQualitativeTestType = (testType: unknown): QualitativeTestType => {
  const identifiedElement = qualitativeMatTestTypes
    .concat(qualitativeColumnTestTypes)
    .find((element) => element === testType);
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface QualitativeTestSuiteProps extends BaseTestSuite {
  type: QualitativeTestType;
  target: TestTarget;
}

export interface QualitativeTestSuiteDto {
  id: string;
  activated: boolean;
  type: QualitativeTestType;
  target: TestTarget;
  cron: string;
  executionType: ExecutionType;
}

export class QualitativeTestSuite implements BaseTestSuite {
  #id: string;

  #activated: boolean;

  #type: QualitativeTestType;

  #target: TestTarget;

  #cron: string;

  #executionType: ExecutionType;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get type(): QualitativeTestType {
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

  private constructor(props: QualitativeTestSuiteProps) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#target = props.target;
    this.#cron = props.cron;
    this.#executionType = props.executionType;
  }

  static create = (props: QualitativeTestSuiteProps): QualitativeTestSuite => {
    const { type, target, ...remainingProps } = props;

    if (!remainingProps.id) throw new TypeError('TestSuite must have id');
    if (!remainingProps.cron) throw new TypeError('TestSuite must have cron');
    if (!remainingProps.executionType)
      throw new TypeError('Test suite must have execution type');
    if (qualitativeMatTestTypes.includes(type) && target.columnName)
      throw new SyntaxError(
        'Column name provision only allowed for column level tests'
      );

    const parsedType = parseQualitativeTestType(type);
    const parsedMaterializationType = parseMaterializationType(
      target.materializationType
    );

    return new QualitativeTestSuite({
      ...props,
      type: parsedType,
      target: {
        ...target,
        materializationType: parsedMaterializationType,
      },
    });
  };

  toDto = (): QualitativeTestSuiteDto => ({
    id: this.#id,
    activated: this.#activated,
    type: this.#type,
    target: this.#target,
    cron: this.#cron,
    executionType: this.#executionType,
  });
}
