/* eslint-disable */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  HttpException,
  HttpStatus,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('api/v1/product')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get('/get-all')
  @Roles('ADMIN')
  async getAllProduct(@Query() pagination: PaginationDto) {
    return await this.productService.getAllProduct(pagination);
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') // chỉ admin mới được tạo
  async postProduct(
    @Body() postData: Partial<Product>,
    @Req() req,
  ) {
    try {
      const userId = req.user.id; // lấy userId từ JWT
      const product = await this.productService.createProduct({
        ...postData,
        createdById: userId,
      });

      return {
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Create product failed' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/get-detail/:id')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Param('id') id: string) {
    const product = await this.productService.getProduct(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }


  @Put('/update/:id')
  @Roles('ADMIN')
  async updateProduct(
    @Param('id') id: string,
    @Body() postData: Partial<Product>,
  ) {
    try {
      const updated = await this.productService.updateProduct(id, postData);
      return {
        message: 'Product updated successfully',
        data: updated,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Update product failed' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('/delete/:id')
  @Roles('ADMIN')
  async deleteProduct(@Param('id') id: string) {
    try {
      await this.productService.deleteProduct(id);
      return {
        message: 'Product deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Delete product failed' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
