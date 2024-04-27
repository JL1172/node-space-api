import {
  IsAlphanumeric,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class DraftedMessageBody {
  @IsNotEmpty({ message: 'Subject Is Required.' })
  @IsString({ message: 'Must Be A String.' })
  @IsAlphanumeric('en-US', {
    message: 'Subject Must Only Contain Letters And/Or Numbers.',
  })
  @MinLength(4, { message: 'Subject Must Exceed 4 Characters.' })
  message_subject: string;
  @IsNotEmpty({ message: 'Text Is Required.' })
  @IsString({ message: 'Must Be A String.' })
  @MinLength(5, { message: 'Message Length Must Exceed 5 Characters.' })
  message_text: string;
  @IsNotEmpty({ message: 'Sender Is Required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: 'Must Be A Number.' },
  )
  message_sender_id: number;
  @IsNotEmpty({ message: 'Recipient Is Required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: 'Must Be A Number.' },
  )
  message_recipient_id: number;
}
