import { HttpStatus, Injectable } from '@nestjs/common';
import * as validator from 'validator';
import * as jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { ProjectErrorHandler } from './error';
import { Cloudmersive } from './cloudmersive-client';

//this class provider will just completely take care of sanitation and validation
@Injectable()
export class FileUtilProvider {
  constructor(
    private readonly errorHandler: ProjectErrorHandler,
    private readonly cloudmersive: Cloudmersive,
  ) {}
  //cloudmersive
  //validator dependency
  private readonly validate: typeof validator = validator;
  //png magic numberr
  private readonly magic_png_no: string = '89504E470D0A1A0A' as const;
  //jpeg and jpg magic no.
  private readonly magic_jpeg_jpg_no: string = 'FFD8FFE0' as const;
  //jpg dependency
  private readonly jpg: typeof jpeg = jpeg;
  //finalfiles
  private finalFiles: Array<Express.Multer.File>;
  //getter
  private getFiles(): Array<Express.Multer.File> {
    return this.finalFiles;
  }
  //sanitize
  public sanitizeFileName(
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
  public async validateFile(file: Express.Multer.File): Promise<void | PNG> {
    const buffer = file.buffer.subarray(0, 8).toString('hex').toUpperCase();
    if (this.magic_png_no === buffer) {
      await new Promise((resolve, reject) => {
        const png = new PNG();
        png.on('parsed', () => {
          resolve(png);
        });
        png.on('error', (error) => {
          console.log(error);
          reject(
            `Invalid File Type For File: ${file.originalname}, expected type PNG, JPEG, JPG`,
          );
        });
        png.parse(file.buffer);
      });
    } else {
      if (this.magic_jpeg_jpg_no === buffer.slice(0, 8)) {
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
        const result = await this.cloudmersive.validatePdf(file.buffer);
        if (result.data?.DocumentIsValid === false) {
          this.errorHandler.reportError(
            'Invalid File Type, Cannot Parse File.',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }
    }
  }
}
//eof
