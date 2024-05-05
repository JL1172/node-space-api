import { HttpStatus, Injectable } from '@nestjs/common';
import * as validator from 'validator';
import { PNG } from 'pngjs';
import * as jpeg from 'jpeg-js';
import { CustomerErrorHandler } from './error';

//this class provider will just completely take care of sanitation and validation
@Injectable()
export class FileUtilProvider {
  constructor(private readonly errorHandler: CustomerErrorHandler) {}
  //validator dependency
  private readonly validate: typeof validator = validator;
  //png magic numberr
  private readonly magic_png_no: string = '89504E470D0A1A0A' as const;
  //jpeg and jpg magic no.
  private readonly magic_jpeg_jpg_no: string = 'FFD8FFE0' as const;
  //png dependency
  private readonly png: PNG = new PNG({ filterType: 4 });
  //jpg dependency
  private readonly jpg: typeof jpeg = jpeg;
  //finalfiles
  private finalFiles: Array<Express.Multer.File>;
  //getter
  private getFiles(): Array<Express.Multer.File> {
    return this.finalFiles;
  }
  //sanitize
  private sanitizeFileName(
    unsanitizedFile: Array<Express.Multer.File>,
  ): Array<Express.Multer.File> {
    this.finalFiles = unsanitizedFile.map((file: Express.Multer.File) => {
      file.originalname = this.validate.trim(file.originalname);
      file.originalname = this.validate.escape(file.originalname);
      file.originalname = this.validate.blacklist(
        file.originalname,
        /[\x00-\x1F\s;'"\\<>]/.source,
      );
      return file;
    });
    return this.getFiles();
  }
  //validate magic number and binary data structure
  private async validateFile(file: Express.Multer.File): Promise<void> {
    const buffer: string = file.buffer
      .subarray(0, 8)
      .toString('hex')
      .toUpperCase();
    if (this.magic_png_no === buffer) {
      console.log('1', file.originalname);
      await new Promise((resolve, reject) => {
        this.png.parse(Buffer.from(file.buffer), (error, data) => {
          if (error) {
            console.log(error);
            reject(
              `Invalid File Type For File ${file.originalname}, expected type ${file.mimetype}`,
            );
          } else {
            resolve(data);
          }
        });
      });
    } else {
      if (this.magic_jpeg_jpg_no === buffer.slice(0, 8)) {
        console.log('2', buffer);
        const isValidJpegOrJpg = this.jpg.decode(file.buffer, {
          useTArray: true,
        });
        if (!isValidJpegOrJpg) {
          this.errorHandler.reportError(
            `Invalid File Type For File ${file.originalname}, expected type ${file.mimetype}`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      } else {
        console.log('3', buffer);
        this.errorHandler.reportError(
          'Invalid File Type, Cannot Parse File.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }
  }
  public async validateFiles(
    unsanitizedFiles: Array<Express.Multer.File>,
  ): Promise<Array<Express.Multer.File>> {
    try {
      //sanitized names
      const sanitizedFiles: Array<Express.Multer.File> =
        this.sanitizeFileName(unsanitizedFiles);
      //for loop for validate method
      for (const img of sanitizedFiles) {
        await this.validateFile(img);
      }
      return sanitizedFiles;
    } catch (err) {
      this.errorHandler.reportError(err, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
