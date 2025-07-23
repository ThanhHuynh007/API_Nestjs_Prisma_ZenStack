/* eslint-disable */
import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    Param,
    Patch,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';


@Controller('api/v1/order')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    @Roles('USER')
    async create(@Req() req, @Body() dto: CreateOrderDto) {
        return this.orderService.createOrder(req.user.id, dto);
    }

    @Get('/:id')
    @Roles('USER', 'ADMIN')
    async getOrderById(@Param('id') id: string, @Req() req) {
        return this.orderService.getOrderById(id, req.user);
    }


    @Get('/my-orders')
    @Roles('USER')
    async myOrders(@Req() req) {
        return this.orderService.getOrdersByUser(req.user.id);
    }

    @Get('/all-order')
    @Roles('ADMIN')
    async allOrders() {
        return this.orderService.getAllOrders();
    }

    @Patch('/status/:id')
    @Roles('ADMIN', 'USER')
    async updateStatus(
        @Req() req,
        @Param('id') orderId: string,
        @Body() body: { status: OrderStatus },
    ) {
        return this.orderService.updateOrderStatus(orderId, body.status, req.user);
    }

}
