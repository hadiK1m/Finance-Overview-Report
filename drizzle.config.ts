// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'; // 1. Ganti impor 'Config' dengan 'defineConfig'
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 2. Bungkus ekspor Anda dengan fungsi defineConfig
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // 3. Ganti 'driver' menjadi 'dialect' dan nilainya menjadi 'postgresql'
  dbCredentials: {
    url: process.env.POSTGRES_URL!, // 4. Ganti 'connectionString' menjadi 'url'
  },
});
