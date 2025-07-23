/* eslint-disable */
import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';


@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService) { }

    async createOrder(userId: string, dto: CreateOrderDto) {
        let total = 0;

        const orderItems = await Promise.all(
            dto.items.map(async (item) => {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) throw new NotFoundException('Product not found');

                if (!product.inStock || product.quantity < item.quantity) {
                    throw new BadRequestException('Product out of stock');
                }

                total += product.price * item.quantity;

                return {
                    productId: product.id,
                    quantity: item.quantity,
                    price: product.price,
                };
            }),
        );

        const discountPercent = dto.discount ?? 0;         // ví dụ 10 (%)
        const shipping = dto.shipping ?? 0;

        const discountAmount = (total * discountPercent) / 100;
        const finalTotal = Number((total - discountAmount + shipping).toFixed(2));

        const order = await this.prisma.order.create({
            data: {
                userId,
                totalAmount: finalTotal,
                discount: discountPercent,
                shipping,
                paymentMethod: dto.paymentMethod,
                shippingFullName: dto.shippingAddress?.fullName,
                shippingAddress: dto.shippingAddress?.address,
                shippingCity: dto.shippingAddress?.city,
                shippingPhone: dto.shippingAddress?.phone,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: true,
            },
        });

        // Cập nhật tồn kho
        for (const item of dto.items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
            });

            const remaining = (product?.quantity ?? 0) - item.quantity;

            await this.prisma.product.update({
                where: { id: item.productId },
                data: {
                    quantity: {
                        decrement: item.quantity,
                    },
                    inStock: remaining > 0,
                },
            });
        }

        return order;
    }

    async getOrderById(orderId: string, user: { id: string; role: string }) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: true,
            },
        });

        if (!order) throw new NotFoundException('Order not found');

        // Nếu user là USER, chỉ cho xem đơn của họ
        if (user.role === 'USER' && order.userId !== user.id) {
            throw new BadRequestException('Access denied');
        }

        return order;
    }


    async getOrdersByUser(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async getAllOrders() {
        return this.prisma.order.findMany({
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: true,
            },
        });
    }

    async updateOrderStatus(
        orderId: string,
        newStatus: OrderStatus,
        user: { id: string; role: string },
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }, // cần để hoàn tác tồn kho nếu cần
        });

        if (!order) throw new NotFoundException('Order not found');

        if (user.role === 'USER') {
            if (order.userId !== user.id) {
                throw new BadRequestException('You can only cancel your own orders');
            }
            if (order.status !== 'PENDING' || newStatus !== 'CANCELLED') {
                throw new BadRequestException('You can only cancel pending orders');
            }

            // ✅ Khôi phục số lượng sản phẩm
            for (const item of order.items) {
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: { increment: item.quantity },
                        inStock: true,
                    },
                });
            }

            await this.prisma.orderItem.deleteMany({
                where: { orderId: orderId },
            });

            // ✅ Xoá đơn hàng
            await this.prisma.order.delete({
                where: { id: orderId },
            });

            return { message: 'Order cancelled and deleted' };
        }

        // Với admin: chỉ cập nhật trạng thái nếu chưa COMPLETED/CANCELLED
        if (
            order.status === 'COMPLETED' ||
            order.status === 'CANCELLED'
        ) {
            throw new BadRequestException(
                `Cannot update order that is already ${order.status}`,
            );
        }

        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: newStatus,
            },
        });

        return updated;
    }

}
