import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { SchemaChangeAlertDto } from './schema-change-alert-dto';
import { appConfig } from '../../../config';

export type SendSchemaChangeSlackAlertRequestDto = {
  alertDto: SchemaChangeAlertDto;
  targetOrganizationId: string;
};

export interface SendSchemaChangeSlackAlertAuthDto {
  jwt: string;
}

export type SendSchemaChangeSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendSchemaChangeSlackAlert
  implements
    IUseCase<
      SendSchemaChangeSlackAlertRequestDto,
      SendSchemaChangeSlackAlertResponseDto,
      SendSchemaChangeSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  #buildAlertMessageConfig = (schemaChangeAlertDto: SchemaChangeAlertDto): AlertMessageConfig => ({
    alertId: schemaChangeAlertDto.alertId,
    occuredOn: `${schemaChangeAlertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `Schema Change Alert`,
    detectedValuePart: `*Detected Schema Change:*\n${schemaChangeAlertDto.schemaDiffs}`,
    expectedRangePart: ``,
    summaryPart: schemaChangeAlertDto.message.replace(
      '__base_url__',
      appConfig.slack.resourceBaseUrl
    ),
  });

  async execute(
    request: SendSchemaChangeSlackAlertRequestDto,
    auth: SendSchemaChangeSlackAlertAuthDto
  ): Promise<SendSchemaChangeSlackAlertResponseDto> {
    try {
      const messageConfig = this.#buildAlertMessageConfig(request.alertDto);

      const sendSchemaChangeSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrganizationId,
          auth.jwt
        );

      return Result.ok(sendSchemaChangeSlackAlertResponse);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
