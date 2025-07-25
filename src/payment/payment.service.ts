/* eslint-disable */
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import Stripe from 'stripe'
import { PrismaService } from '../prisma.service'
import { OrderService } from '../order/order.service'
import { Request } from 'express'

@Injectable()
export class PaymentService {
    private stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-06-30.basil',
    })

    constructor(private prisma: PrismaService, private orderService: OrderService) { }

    async createCheckoutSession(orderId: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } })
        if (!order) throw new InternalServerErrorException('Order not found')

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Order #${order.id}`,
                        },
                        unit_amount: Math.round(order.totalAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/payment-success?orderId=${order.id}`,
            cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
            metadata: { orderId: order.id },
        })

        await this.prisma.order.update({
            where: { id: order.id },
            data: { stripeSessionId: session.id },
        })

        return session
    }

    async handleWebhook(req: Request, signature: string) {
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
        const body = (req as any).rawBody

        let event: Stripe.Event
        try {
            event = this.stripe.webhooks.constructEvent(body, signature, endpointSecret)
        } catch (err) {
            console.error('Webhook Error:', err.message)
            return { status: 400, message: `Webhook Error: ${err.message}` }
        }

        // ✅ Kiểm tra event là thanh toán thành công
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const orderId = session.metadata?.orderId

            if (orderId) {
                // ✅ Gọi OrderService để cập nhật trạng thái
                await this.prisma.order.update({
                    where: { id: orderId },
                    data: { status: 'COMPLETED' },
                })

                // 👉 Nếu muốn: gọi hàm gửi email/hóa đơn ở đây
            }
        }

        return { status: 200, message: 'Webhook received' }
    }

}
