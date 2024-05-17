import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SaplingClient {
  private readonly key = process.env.SAPLING_API_KEY;
  private readonly url = process.env.SAPLING_API_URL;
  public async getRephrasedMessage(content: string) {
    try {
      const res = await axios.post(this.url, {
        text: content,
        key: this.key,
        mapping: 'informal_to_formal',
      });
      return res;
    } catch (err) {
      throw new HttpException(
        'An Unexpected Problem Occurred With The Rephrase Suggestions.',
        err?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
