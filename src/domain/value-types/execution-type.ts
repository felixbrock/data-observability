export const executionTypes = ['automatic', 'frequency'] as const;
export type ExecutionType = typeof executionTypes[number];

export const parseExecutionType = (
  executionType: unknown
): ExecutionType => {
  const identifiedElement = executionTypes.find(
    (element) => element === executionType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};