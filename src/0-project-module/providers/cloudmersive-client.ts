import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import 'dotenv/config';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class Cloudmersive {
  private readonly url: string = process.env.CLOUDMERSIVE_API_URL;
  private readonly key: string = process.env.CLOUDMERSIVE_API_KEY;
  private readonly axiosInstance = axios.create({
    headers: { apiKey: this.key },
  });
  public async validatePdf(file: Buffer): Promise<AxiosResponse> {
    try {
      const res = await this.axiosInstance.post(this.url, file);
      return res;
    } catch (err) {
      throw new HttpException(
        err.response.data.Message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
