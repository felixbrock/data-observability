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

export const nominalMatTestTypes = ['MaterializationSchemaChange'] as const;

export const nominalColumnTestTypes = [] as const;

export type NominalTestType =
  | typeof nominalMatTestTypes[number]
  | typeof nominalColumnTestTypes[number];

export const parseNominalTestType = (testType: unknown): NominalTestType => {
  const identifiedElement = nominalMatTestTypes
    .concat(nominalColumnTestTypes)
    .find((element) => element === testType);
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface NominalTestSuiteProps extends BaseTestSuite {
  type: NominalTestType;
  target: TestTarget;
}

export interface NominalTestSuiteDto {
  id: string;
  activated: boolean;
  type: NominalTestType;
  target: TestTarget;
  cron: string;
  executionType: ExecutionType;
}

export class NominalTestSuite implements BaseTestSuite {
  #id: string;

  #activated: boolean;

  #type: NominalTestType;

  #target: TestTarget;

  #cron: string;

  #executionType: ExecutionType;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get type(): NominalTestType {
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

  private constructor(props: NominalTestSuiteProps) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#target = props.target;
    this.#cron = props.cron;
    this.#executionType = props.executionType;
  }

  static create = (props: NominalTestSuiteProps): NominalTestSuite => {
    const { type, target, ...remainingProps } = props;

    if (!remainingProps.id) throw new TypeError('TestSuite must have id');
    if (!remainingProps.cron) throw new TypeError('TestSuite must have cron');
    if (!remainingProps.executionType)
      throw new TypeError('Test suite must have execution type');
    if (nominalMatTestTypes.includes(type) && target.columnName)
      throw new SyntaxError(
        'Column name provision only allowed for column level tests'
      );

    const parsedType = parseNominalTestType(type);
    const parsedMaterializationType = parseMaterializationType(
      target.materializationType
    );

    return new NominalTestSuite({
      ...props,
      type: parsedType,
      target: {
        ...target,
        materializationType: parsedMaterializationType,
      },
    });
  };

  toDto = (): NominalTestSuiteDto => ({
    id: this.#id,
    activated: this.#activated,
    type: this.#type,
    target: this.#target,
    cron: this.#cron,
    executionType: this.#executionType,
  });
}
