import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './Product/product.module'
import { OrderModule } from './order/order.module'

@Module({
  imports: [ AuthModule, UserModule, ProductModule, OrderModule ],
  controllers: [],
  providers: [],
})
export class AppModule { }
