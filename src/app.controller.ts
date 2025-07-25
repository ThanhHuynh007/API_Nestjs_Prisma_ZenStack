// app.controller.ts hoặc bất kỳ controller nào
import { Controller, Get, Query } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('success')
  handleSuccess(@Query('orderId') orderId: string) {
    return {
      message: 'Thanh toán thành công!',
      orderId,
    };
  }

  @Get('cancel')
  handleCancel() {
    return {
      message: 'Đã huỷ thanh toán!',
    };
  }
}
