import { PrismaClient } from "@prisma/client";

// PrismaClientのシングルトンインスタンスを作成
const prisma = new PrismaClient();

export default prisma;
