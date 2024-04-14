import { Injectable } from '@nestjs/common';
import * as nodemail from 'nodemailer';
@Injectable()
export class Mailer {
  private readonly nodemailer = nodemail.createTransport({
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASS,
    },
  });
  public async draftEmail(
    email: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: subject,
      html: text,
    };
    return new Promise((resolve, reject) =>
      this.nodemailer.sendMail(mailOptions, (error: unknown) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }),
    );
  }
}
