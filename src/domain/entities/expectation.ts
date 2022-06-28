export interface ExpectationProperties {
  localId: string;
  type: string;
  threshold: number;
}

export class Expectation {
  #localId: string;

#type: string;

  #threshold: number;

  get localId(): string {
    return this.#localId;
  }

  get type(): string {
    return this.#type;
  }

  get threshold(): number {
    return this.#threshold;
  }

  private constructor(properties: ExpectationProperties) {
    this.#localId = properties.localId;
    this.#type = properties.type;
    this.#threshold = properties.threshold;
  }

  static create = (properties: ExpectationProperties): Expectation => {
    if (!properties.localId) throw new TypeError('Expectation must have id');
    if (!properties.type) throw new TypeError('Expectation must have type');
    if (!properties.threshold) throw new TypeError('Expectation must have threshold');

    const expectation = new Expectation(properties);

    return expectation;
  };
}
