import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  name!: string;

  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])/, {
    message:
      'Password must contain at least one letter, one number, and one special character',
  })
  password!: string;
}