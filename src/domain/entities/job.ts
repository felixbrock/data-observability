export interface JobPrototype {
  id: string;
  frequency: string;
  testSuiteId: string;
}

interface JobProperties {
  id: string;
  frequency: Frequency;
  testSuiteId: string;
}

export const frequencies = ['1h' , '3h' , '6h' , '12h' , '24h'] as const;
export type Frequency = typeof frequencies[number];

export class Job {
  #id: string;

  #frequency: Frequency;

  #testSuiteId: string;

  get id(): string {
    return this.#id;
  }

  get frequency(): Frequency {
    return this.#frequency;
  }

  get testSuiteId(): string {
    return this.#testSuiteId;
  }

  private constructor(props: JobProperties) {
    this.#id = props.id;
    this.#frequency = props.frequency;
    this.#testSuiteId = props.testSuiteId;
  }

  static #parseFrequency(frequency: unknown): Frequency {
    const identifiedFrequency = frequencies.find(
      (validFrequency) => validFrequency === frequency
    );
    if (identifiedFrequency) return identifiedFrequency;
    throw new Error('Provision of invalid job frequency');
  }

  static create = (prototype: JobPrototype): Job => {
    if (!prototype.id) throw new TypeError('Job must have id');
    if (!prototype.frequency) throw new TypeError('Job must have frequency');
    if (!prototype.testSuiteId) throw new TypeError('Job must have test suite id');

    const frequency: Frequency = this.#parseFrequency(prototype.frequency);

    const job = new Job({...prototype, frequency});

    return job;
  };

}
