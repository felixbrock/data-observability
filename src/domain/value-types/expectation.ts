export interface ExpectationProperties {
  type: string;
  configuration: ExpectationConfiguration;
}

export type ExpectationConfiguration = { [key: string]: string | number }; 

export class Expectation {

  #type: string;

  #configuration: ExpectationConfiguration;


  get type(): string {
    return this.#type;
  }

  get configuration(): ExpectationConfiguration {
    return this.#configuration;
  }

  private constructor(properties: ExpectationProperties) {
    this.#type = properties.type;
    this.#configuration = properties.configuration;
  }

  static create = (props: ExpectationProperties): Expectation => {
    if (!props.configuration)
      throw new TypeError('Expectation must have configuration');
      if (!props.configuration)
      throw new TypeError('Expectation must have configuration');

    return new Expectation(props);
  };
}
