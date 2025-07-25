import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './Product/product.module'
import { OrderModule } from './order/order.module'
import { PaymentModule } from './payment/payment.module'
import { AppController } from './app.controller'
import { MailerService } from './mailer/mailer.service';

@Module({
  imports: [AuthModule, UserModule, ProductModule, OrderModule, PaymentModule],
  controllers: [AppController],
  providers: [ MailerService ],
})
export class AppModule { }
