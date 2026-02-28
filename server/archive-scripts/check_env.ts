import dotenv from 'dotenv';
dotenv.config();

console.log('RUNTIME DATABASE_URL:');
console.log(process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);
process.exit(0);
