import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config({ path: './config/config.env' });

const host = process.env.NODEMAILER_SERVICE_HOST;
const port = Number(process.env.NODEMAILER_SERVICE_PORT || 587);
const user = process.env.NODEMAILER_SENDING_EMAIL_ADDRESS;
const pass = process.env.NODEMAILER_SENDING_EMAIL_PASSWORD;
const secure = String(process.env.NODEMAILER_SECURE || 'false').toLowerCase() === 'true';

const transport = host && user && pass
  ? nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
  : null;

export const isMailConfigured = Boolean(transport);
export default transport;