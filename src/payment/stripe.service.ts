// src/payment/stripe.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    }

    async createCheckoutSession(orderId: string, amount: number) {
        const session = await this.stripe.checkout.sessions.create({
            mode: 'payment',
            success_url: `http://localhost:3000/success?orderId=${orderId}`,
            cancel_url: `http://localhost:3000/cancel`,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Order #${orderId}`,
                        },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                orderId,
            },
        });

        return session.url;
    }

    getStripeInstance() {
        return this.stripe;
    }
}
