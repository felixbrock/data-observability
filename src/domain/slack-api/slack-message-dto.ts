export interface SlackMessage {
  executionTime: string;
  testType: string;
  unexpectedValues: number[];
  testedValueCount: number;
  tableName: string;
  columnName: string;
  deviation: number;
}