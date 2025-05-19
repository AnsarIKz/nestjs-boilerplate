import dotenv from 'dotenv'
import assert from 'assert'

dotenv.config()

export const env = {


  PORT: parseInt(process.env.PORT || '3000', 10),

  DATABASE_URL: process.env.DATABASE_URL,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
 


  IG_USERNAME: process.env.IG_USERNAME,
  IG_PASSWORD: process.env.IG_PASSWORD,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

}
