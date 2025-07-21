import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async getAllProduct(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const existing = await this.prisma.product.findFirst({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Product name already exists');
    }

    // Loại bỏ trường undefined hoặc null không phù hợp cho Prisma
    const cleanData: Prisma.ProductCreateInput = {
      name: data.name!,
      description: data.description ?? undefined,
      price: data.price!,
      sku: data.sku!,
      inStock: data.inStock ?? undefined,
      // Nếu bạn có quan hệ createdBy, nên xử lý đúng cách ở đây
      // createdById chỉ add khi khác null/undefined
      ...(data.createdById ? { createdById: data.createdById } : {}),
    };

    return this.prisma.product.create({ data: cleanData });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // Tương tự, lọc data trước khi update
    const updateData: Prisma.ProductUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.inStock !== undefined && { inStock: data.inStock }),
      // createdById có thể cần xử lý riêng nếu cập nhật quan hệ
    };

    return this.prisma.product.update({ where: { id }, data: updateData });
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
  }
}
