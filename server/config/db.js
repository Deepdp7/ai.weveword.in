import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const envUrl = process.env.DATABASE_URL;
const url = (!envUrl || envUrl === 'undefined') ? 'file:./dev.db' : envUrl;

const libsql = createClient({ url });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log(`SQLite Database Connected via Prisma`);
  } catch (error) {
    console.error(`Error connecting to Database: ${error.message}`);
    process.exit(1);
  }
};

export { prisma, connectDB };
