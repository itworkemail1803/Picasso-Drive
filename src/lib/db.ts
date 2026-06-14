import { PrismaClient } from "@prisma/client";

// Khai báo kiểu dữ liệu global để lưu instance của Prisma
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Sử dụng instance cũ nếu có, hoặc tạo mới
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // Tùy chọn: log câu lệnh query ra console để debug
  });

// Lưu instance vào global trong môi trường development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
