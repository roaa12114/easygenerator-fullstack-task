import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/sign-in.dto';
import { SignupDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 1000, // 1 hour, matches JWT expiry
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.signup(signUpDto);
    res.cookie('access_token', access_token, COOKIE_OPTIONS);
    return { message: 'User registered successfully' };
  }

  @Post('sign-in')
  async signIn(
    @Body() signInDto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.signin(signInDto);
    res.cookie('access_token', access_token, COOKIE_OPTIONS);
    return { message: 'User signed in successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    return { message: 'Welcome to the application.', user: req.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'User logged out successfully' };
  }
}
