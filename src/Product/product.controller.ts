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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from '@prisma/client';

@Controller('api/v1/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('/get-all')
  async getAllProduct(): Promise<Product[]> {
    return await this.productService.getAllProduct();
  }

  @Post('/create')
  async postProduct(@Body() postData: Partial<Product>) {
    try {
      const product = await this.productService.createProduct(postData);
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
  async getProduct(@Param('id') id: string) {
    const product = await this.productService.getProduct(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  @Put('/update/:id')
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
