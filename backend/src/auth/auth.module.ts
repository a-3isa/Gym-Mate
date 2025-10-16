import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

/**
 * Module handling user authentication and profile management.
 * Integrates with Firebase for authentication and Firestore for user data storage.
 */
@Module({
  imports: [FirebaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
