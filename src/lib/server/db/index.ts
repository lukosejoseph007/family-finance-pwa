import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Check if DATABASE_URL is set and valid
const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('DATABASE_URL is not set. Database functionality will be disabled.');
  console.warn('Please set DATABASE_URL in your .env file to enable database operations.');
}

// Only create database connection if URL is provided and not a placeholder
const isDatabaseAvailable = databaseUrl &&
  !databaseUrl.includes('placeholder') &&
  !databaseUrl.includes('your-') &&
  databaseUrl.startsWith('postgres');

let db: ReturnType<typeof drizzle> | null = null;

if (isDatabaseAvailable) {
  try {
    const client = postgres(databaseUrl);
    db = drizzle(client, { schema });
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.warn('Database functionality will be disabled.');
  }
} else {
  console.warn('Database not available - using placeholder configuration');
}

export { db };

// Helper function to check if database is available
export function isDatabaseConnected(): boolean {
  return db !== null;
}

// Helper function to get database or throw error
export function requireDatabase() {
  if (!db) {
    throw new Error('Database is not available. Please configure DATABASE_URL.');
  }
  return db;
}
