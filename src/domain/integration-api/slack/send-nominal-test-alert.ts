import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { NominalTestAlertDto } from './nominal-test-alert-dto';
import { appConfig } from '../../../config';

export type SendNominalTestSlackAlertRequestDto = {
  alertDto: NominalTestAlertDto;
  targetOrgId: string;
};

export interface SendNominalTestSlackAlertAuthDto {
  jwt: string;
}

export type SendNominalTestSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendNominalTestSlackAlert
  implements
    IUseCase<
      SendNominalTestSlackAlertRequestDto,
      SendNominalTestSlackAlertResponseDto,
      SendNominalTestSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  #buildAlertMessageConfig = (
    alertDto: NominalTestAlertDto
  ): AlertMessageConfig => ({
    alertId: alertDto.alertId,
    testType: alertDto.testType,
    occurredOn: `${alertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `Schema Change Alert`,
    detectedValuePart: `*Detected Schema Change:*\n${alertDto.schemaDiffs}`,
    expectedRangePart: ``,
    summaryPart: alertDto.message.replace(
      '__base_url__',
      appConfig.slack.callbackRoot
    ),
  });

  async execute(
    request: SendNominalTestSlackAlertRequestDto,
    auth: SendNominalTestSlackAlertAuthDto
  ): Promise<SendNominalTestSlackAlertResponseDto> {
    try {
      const messageConfig = this.#buildAlertMessageConfig(request.alertDto);

      const sendSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrgId,
          auth.jwt
        );

      return Result.ok(sendSlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
