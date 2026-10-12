
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  private validateId(id: string, label: string): number {
    const value = Number(id);

    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException(`Invalid ${label} ID`);
    }

    return value;
  }

  @Get()
  getMessage() {
    return { message: 'Server Running Successfully!' };
  }

  // USERS API

  @Get('users')
  async getUsers() {
    return this.databaseService.query(
      'SELECT id, name, email, created_at FROM users'
    );
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const userId = this.validateId(id, 'user');
    const result: any = await this.databaseService.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (result.length === 0) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }

  @Post('users')
  async createUser(
    @Body() body: { name: string; email: string; password: string }
  ) {
    if (!body.name || !body.email || !body.password) {
      throw new BadRequestException(
        'Name, email, and password are required'
      );
    }

    try {
      const result: any = await this.databaseService.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [body.name, body.email, body.password]
      );

      return {
        message: 'User created successfully!',
        id: result.insertId,
      };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { name: string; email: string; password: string }
  ) {
    const userId = this.validateId(id, 'user');

    if (!body.name || !body.email || !body.password) {
      throw new BadRequestException(
        'Name, email, and password are required'
      );
    }

    try {
      const result: any = await this.databaseService.query(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [body.name, body.email, body.password, userId]
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException('User not found');
      }

      return { message: 'User updated successfully!' };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const userId = this.validateId(id, 'user');
    const result: any = await this.databaseService.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully!' };
  }

  // CATEGORIES API

  @Get('categories')
  async getCategories() {
    return this.databaseService.query('SELECT * FROM categories');
  }

  @Get('categories/:id')
  async getCategory(@Param('id') id: string) {
    const categoryId = this.validateId(id, 'category');
    const result: any = await this.databaseService.query(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    if (result.length === 0) {
      throw new NotFoundException('Category not found');
    }

    return result[0];
  }

  @Post('categories')
  async createCategory(@Body() body: { name: string }) {
    if (!body.name) {
      throw new BadRequestException('Category name is required');
    }

    try {
      const result: any = await this.databaseService.query(
        'INSERT INTO categories (name) VALUES (?)',
        [body.name]
      );

      return {
        message: 'Category created successfully!',
        id: result.insertId,
      };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Category already exists');
      }
      throw error;
    }
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name: string }
  ) {
    const categoryId = this.validateId(id, 'category');

    if (!body.name) {
      throw new BadRequestException('Category name is required');
    }

    try {
      const result: any = await this.databaseService.query(
        'UPDATE categories SET name = ? WHERE id = ?',
        [body.name, categoryId]
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException('Category not found');
      }

      return { message: 'Category updated successfully!' };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Category already exists');
      }
      throw error;
    }
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    const categoryId = this.validateId(id, 'category');
    const result: any = await this.databaseService.query(
      'DELETE FROM categories WHERE id = ?',
      [categoryId]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Category not found');
    }

    return { message: 'Category deleted successfully!' };
  }

  // PRODUCTS API

  @Get('products')
  async getProducts() {
    return this.databaseService.query(`
      SELECT products.id, products.name, products.price,
             products.category_id, categories.name AS category_name
      FROM products
      LEFT JOIN categories ON products.category_id = categories.id
    `);
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    const productId = this.validateId(id, 'product');
    const result: any = await this.databaseService.query(
      `SELECT products.id, products.name, products.price,
              products.category_id, categories.name AS category_name
       FROM products
       LEFT JOIN categories ON products.category_id = categories.id
       WHERE products.id = ?`,
      [productId]
    );

    if (result.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return result[0];
  }

  @Post('products')
  async createProduct(
    @Body() body: { name: string; price: number; category_id?: number | null }
  ) {
    if (
      !body.name ||
      body.price === undefined ||
      body.price === null ||
      !Number.isFinite(Number(body.price)) ||
      Number(body.price) < 0
    ) {
      throw new BadRequestException(
        'A product name and a valid non-negative price are required'
      );
    }

    const categoryId =
      body.category_id === undefined || body.category_id === null
        ? null
        : Number(body.category_id);

    if (
      categoryId !== null &&
      (!Number.isInteger(categoryId) || categoryId < 1)
    ) {
      throw new BadRequestException('Invalid category ID');
    }

    const result: any = await this.databaseService.query(
      'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
      [body.name, Number(body.price), categoryId]
    );

    return {
      message: 'Product created successfully!',
      id: result.insertId,
    };
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: { name: string; price: number; category_id?: number | null }
  ) {
    const productId = this.validateId(id, 'product');

    if (
      !body.name ||
      body.price === undefined ||
      body.price === null ||
      !Number.isFinite(Number(body.price)) ||
      Number(body.price) < 0
    ) {
      throw new BadRequestException(
        'A product name and a valid non-negative price are required'
      );
    }

    const categoryId =
      body.category_id === undefined || body.category_id === null
        ? null
        : Number(body.category_id);

    if (
      categoryId !== null &&
      (!Number.isInteger(categoryId) || categoryId < 1)
    ) {
      throw new BadRequestException('Invalid category ID');
    }

    const result: any = await this.databaseService.query(
      'UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?',
      [body.name, Number(body.price), categoryId, productId]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product updated successfully!' };
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    const productId = this.validateId(id, 'product');
    const result: any = await this.databaseService.query(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product deleted successfully!' };
  }
}
