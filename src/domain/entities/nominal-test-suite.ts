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

export interface NominalTestSuiteProperties extends BaseTestSuite {
  type: NominalTestType;
  target: TestTarget;
}

export interface NominalTestSuiteDto {
  id: string;
  activated: boolean;
  type: NominalTestType;
  executionFrequency: number;
  target: TestTarget;
  organizationId: string;
}

export class NominalTestSuite implements BaseTestSuite {
  #id: string;

  #organizationId: string;

  #activated: boolean;

  #type: NominalTestType;

  #target: TestTarget;

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

  get type(): NominalTestType {
    return this.#type;
  }

  get target(): TestTarget {
    return this.#target;
  }

  get executionFrequency(): number {
    return this.#executionFrequency;
  }

  private constructor(props: NominalTestSuiteProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#executionFrequency = props.executionFrequency;
    this.#target = props.target;
  }

  static create = (props: NominalTestSuiteProperties): NominalTestSuite => {
    const { type, target, ...remainingProps } = props;

    if (!remainingProps.id) throw new TypeError('TestSuite must have id');
    if (!remainingProps.organizationId)
      throw new TypeError('TestSuite must have organization id');
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
    executionFrequency: this.#executionFrequency,
    target: this.#target,
    organizationId: this.#organizationId,
  });
}
