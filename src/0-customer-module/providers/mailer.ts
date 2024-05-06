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
  //main function
  public async draftEmail(
    email: string,
    subject: string,
    text: string,
    attachments?: Array<Express.Multer.File>,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: subject,
      text,
      attachments,
    };
    return await new Promise((resolve, reject) =>
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
