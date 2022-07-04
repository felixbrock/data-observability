export interface JobPrototype {
  localId: string;
  frequency: string;
}

interface JobProperties {
  localId: string;
  frequency: Frequency;
}

export const frequencies = ['1h', '3h', '6h', '12h', '1d'] as const;
export type Frequency = typeof frequencies[number];

const parseFrequency = (frequency: unknown): Frequency => {
  const identifiedFrequency = frequencies.find(
    (validFrequency) => validFrequency === frequency
  );
  if (identifiedFrequency) return identifiedFrequency;
  throw new Error('Provision of invalid job frequency');
};

export class Job {
  #localId: string;

  #frequency: Frequency;

  get localId(): string {
    return this.#localId;
  }

  get frequency(): Frequency {
    return this.#frequency;
  }

  private constructor(props: JobProperties) {
    this.#localId = props.localId;
    this.#frequency = props.frequency;
  }

  static create = (prototype: JobPrototype): Job => {
    if (!prototype.localId) throw new TypeError('Job must have localId');
    if (!prototype.frequency) throw new TypeError('Job must have frequency');

    const frequency: Frequency = parseFrequency(prototype.frequency);

    const job = new Job({ ...prototype, frequency });

    return job;
  };
}
