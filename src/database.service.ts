import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: mysql.Pool;

  constructor(private configService: ConfigService) {
    this.pool = mysql.createPool({
      host: this.configService.get<string>('DB_HOST'),
      port: Number(this.configService.get<string>('DB_PORT')),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  async onModuleInit() {
    const connection = await this.pool.getConnection();

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(150) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          category_id INT,
          FOREIGN KEY (category_id) REFERENCES categories(id)
          ON DELETE SET NULL
        )
      `);

      console.log('Aiven MySQL connected successfully!');
      console.log('Users, categories, and products tables are ready!');
    } finally {
      connection.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(sql: string, values: any[] = []) {
    const [rows] = await this.pool.execute(sql, values);
    return rows;
  }
}
