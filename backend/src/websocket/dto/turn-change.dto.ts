import { IsNotEmpty, IsString } from 'class-validator';

export class TurnChangeDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  nextUserId!: string;
}
