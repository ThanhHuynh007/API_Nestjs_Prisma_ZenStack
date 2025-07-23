/* eslint-disable */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Product, Prisma } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async getAllProduct(
    pagination: PaginationDto,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const page = parseInt(pagination.page || '1', 10);
    const limit = parseInt(pagination.limit || '10', 10);
    const skip = (page - 1) * limit;

    const search = pagination.search?.trim();
    const sortBy = pagination.sortBy || 'createdAt';
    const order = pagination.order || 'desc';

    const where = search
      ? {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const existing = await this.prisma.product.findFirst({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Product name already exists');
    }

    const quantity = data.quantity ?? 0;

    const cleanData: Prisma.ProductCreateInput = {
      name: data.name!,
      description: data.description ?? undefined,
      price: data.price!,
      sku: data.sku!,
      quantity,
      inStock: quantity > 0,
      image: data.image ?? undefined,
      ...(data.createdById
        ? { createdBy: { connect: { id: data.createdById } } }
        : {}),
    };

    return this.prisma.product.create({ data: cleanData });
  }

  async updateProduct(
    id: string,
    data: Partial<Product>,
  ): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const updateData: Prisma.ProductUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.quantity !== undefined && {
        quantity: data.quantity,
        inStock: data.quantity > 0,
      }),
    };

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
  }
}
