import { Injectable } from '@nestjs/common';
import * as nodemail from 'nodemailer';

export enum EmailMarkup {
  PASSWORD_RESET = 'PASSWORD_RESET',
}

@Injectable()
export class Mailer {
  private htmlForPasswordReset = (
    email?: string,
    random6DigitCode?: string,
  ): string => {
    return `<h5>Dear ${email},</h5><p>Thank you for choosing our service! To complete your password change and ensure the security of your account, please use the following verification code:</p>Verification Code: <strong>${random6DigitCode}</strong><p>Please enter this code on our website/app within the next <em>5 Minutes</em> to change your password.</p><p>If you did not request this verification code, please ignore this email.</p><p>Thank you,</p><p>Node Space Team</p>`;
  };
  private readonly respectiveEmailMarkupFunctions: [
    (email: string, random6DigitCode: string) => string,
  ] = [this.htmlForPasswordReset];
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
    text: EmailMarkup,
    random6DigitCode: string,
  ): Promise<void> {
    const htmlToInsert =
      this.respectiveEmailMarkupFunctions[
        Object.keys(EmailMarkup).indexOf(text)
      ];
    const mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: subject,
      html: htmlToInsert(email, random6DigitCode),
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
