// src/payment/payment.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { OrderService } from 'src/order/order.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
  ) {}

  @Post('checkout')
  async createCheckout(@Body() body: { orderId: string }) {
    const order = await this.orderService.getOrderById(body.orderId, {
      id: '',
      role: 'ADMIN', // Hoặc kiểm tra token
    });

    return this.stripeService.createCheckoutSession(order.id, order.totalAmount);
  }
}
