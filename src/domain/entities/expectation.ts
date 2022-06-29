export interface ExpectationProperties {
  localId: string;
  type: string;
  configuration: { [key: string]: string | number };
}

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

  static create = (properties: ExpectationProperties): Expectation => {
    if (!properties.localId) throw new TypeError('Expectation must have id');
    if (!properties.type) throw new TypeError('Expectation must have type');
    if (!properties.configuration)
      throw new TypeError('Expectation must have configuration');


    const expectation = new Expectation(properties);

    return expectation;
  };
}
