import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import Stripe from 'stripe';

@Controller('webhook')
export class WebhookController {
    private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-06-30.basil',
    });

    @Post()
    async handleWebhook(
        @Req() request: any, // bạn có thể dùng StripeRequest nếu extend như trên
        @Res() response: Response,
        @Headers('stripe-signature') signature: string,
    ) {
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(
                request.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!,
            );
        } catch (err) {
            console.log('Webhook Error:', err.message);
            return response.status(HttpStatus.BAD_REQUEST).send(`Webhook Error`);
        }

        // 👇 FIX lỗi Stripe.Checkout.Session not found
        const session = event.data.object as Stripe.Checkout.Session;

        if (event.type === 'checkout.session.completed') {
            // handle payment success
        }

        return response.sendStatus(200);
    }
}
