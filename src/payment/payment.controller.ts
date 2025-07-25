import { Controller, Post, Body, Req, Res, Headers } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { Response, Request } from 'express'

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-checkout-session')
  async createCheckout(@Body() body: { orderId: string }, @Res() res: Response) {
    const session = await this.paymentService.createCheckoutSession(body.orderId)
    res.send({ url: session.url })
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') sig: string) {
    const result = await this.paymentService.handleWebhook(req, sig)
    res.status(result.status).send(result.message)
  }
}
