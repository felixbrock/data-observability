export const customThresholdModes = ['absolute', 'relative'] as const;
export type CustomThresholdMode = typeof customThresholdModes[number];

export const parseCustomThresholdMode = (type: unknown): CustomThresholdMode => {
  if (typeof type !== 'string')
    throw new Error('Provision of type in non-string format');
  const identifiedElement = customThresholdModes.find(
    (element) => element.toLowerCase() === type.toLowerCase()
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};
