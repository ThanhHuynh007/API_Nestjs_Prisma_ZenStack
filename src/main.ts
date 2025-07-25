/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Dùng raw body cho webhook Stripe
  app.use('/payment/webhook', express.raw({ type: 'application/json' }));

  // Cookie Parser phải đặt trước body parsing
  app.use(cookieParser());

  // CORS để frontend có thể gửi cookies
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // đúng domain FE
    credentials: true,
  });

  // Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}`);
}
bootstrap();
