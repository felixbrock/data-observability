export interface ExpectationPrototype {
  testType: string;
  configuration: { [key: string]: string | number };
}

export interface ExpectationProperties {
  type: string;
  testType: string;
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

  #type: string;

  #testType: string;

  #configuration: { [key: string]: string | number };


  get type(): string {
    return this.#type;
  }

  get testType(): string {
    return this.#testType;
  }

  get configuration(): { [key: string]: string | number } {
    return this.#configuration;
  }

  private constructor(properties: ExpectationProperties) {
    this.#type = properties.type;
    this.#testType = properties.testType;
    this.#configuration = properties.configuration;
  }

  static create = (prototype: ExpectationPrototype): Expectation => {
    if (!prototype.testType) throw new TypeError('Expectation must have test type');
    if (!prototype.configuration)
      throw new TypeError('Expectation must have configuration');

    return this.#build(prototype);
  };

  static #build = (prototype: ExpectationPrototype): Expectation => {
    if (!(prototype.testType in expecationType))
      throw new TypeError('Invalid test type provided');

    // todo - type test configuration object

    const properties: ExpectationProperties = {
      type: expecationType[prototype.testType],
      testType: prototype.testType,
      configuration: prototype.configuration,
    };

    return new Expectation(properties);
  };
}
