import { Module } from '@nestjs/common';
import { SignatureGuard } from '../common/guards/signature.guard';
import { TokenGuard } from '../common/guards/token.guard';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { GithubClient } from './github.client';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    GithubClient,
    TokenGuard,
    SignatureGuard,
  ],
  exports: [AuthRepository, TokenGuard, SignatureGuard],
})
export class AuthModule {}
