import { IsNotEmpty, IsNumberString } from 'class-validator';

export class DeleteProjectBody {
  @IsNotEmpty({ message: 'Required.' })
  @IsNumberString({}, { message: 'Must Be A Numeric Value.' })
  pid: string;
  @IsNumberString({}, { message: 'Must Be A Numeric Value.' })
  @IsNotEmpty({ message: 'Required.' })
  cid: string;
  @IsNumberString({}, { message: 'Must Be A Numeric Value.' })
  @IsNotEmpty({ message: 'Required.' })
  uid: string;
}
