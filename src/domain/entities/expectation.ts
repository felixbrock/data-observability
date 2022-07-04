export interface ExpectationPrototype {
  localId: string;
  type: string;
  configuration: { [key: string]: string | number };
}

export interface ExpectationProperties {
  localId: string;
  type: string;
  configuration: { [key: string]: string | number };
}

const expecationType: { [key: string]: string } = {
  Freshness: 'expect_column_max_to_be_between',
  Cardinality: 'expect_column_unique_value_count_to_be_between',
  Uniqueness: 'expect_column_proportion_of_unique_values_to_be_between',
  Nullness: 'expect_column_values_to_not_be_null',
  SortednessIncreasing: 'expect_column_values_to_be_increasing',
  SortednessDecreasing: 'expect_column_values_to_be_decreasing',
  Distribution: 'expect_column_value_z_scores_to_be_less_than',
};

export class Expectation {
  #localId: string;

  #type: string;

  #configuration: { [key: string]: string | number };

  get localId(): string {
    return this.#localId;
  }

  get type(): string {
    return this.#type;
  }

  get configuration(): { [key: string]: string | number } {
    return this.#configuration;
  }

  private constructor(properties: ExpectationProperties) {
    this.#localId = properties.localId;
    this.#type = properties.type;
    this.#configuration = properties.configuration;
  }

  static create = (prototype: ExpectationPrototype): Expectation => {
    if (!prototype.localId) throw new TypeError('Expectation must have id');
    if (!prototype.type) throw new TypeError('Expectation must have type');
    if (!prototype.configuration)
      throw new TypeError('Expectation must have configuration');

    return this.#build(prototype);
  };

  static #build = (prototype: ExpectationPrototype): Expectation => {
    if (!(prototype.type in expecationType))
      throw new TypeError('Invalid test type provided');

    // todo - type test configuration object

    const properties: ExpectationProperties = {
      localId: prototype.localId,
      type: expecationType[prototype.type],
      configuration: prototype.configuration,
    };

    return new Expectation(properties);
  };
}
