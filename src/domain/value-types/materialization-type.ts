export const materializationTypes = ['Table', 'View'] as const;
export type MaterializationType = typeof materializationTypes[number];

export const parseMaterializationType = (
  materializationType: unknown
): MaterializationType => {
  const identifiedElement = materializationTypes.find(
    (element) => element === materializationType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};