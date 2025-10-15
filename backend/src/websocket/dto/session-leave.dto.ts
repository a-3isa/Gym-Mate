import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SessionLeaveDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;
}
