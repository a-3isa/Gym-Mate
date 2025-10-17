import { IsEnum, IsOptional } from 'class-validator';
import { SessionStatus } from './update-session.dto';

export class GetSessionsQueryDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
