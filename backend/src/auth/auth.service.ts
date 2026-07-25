import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import {UsersService} from "../users/users.service";
import {SigninDto} from "./dto/sign-in.dto";
import {SignupDto} from "./dto/sign-up.dto";
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  
  async signup(signupDto: SignupDto) {
    const user = await this.usersService.findByEmail(signupDto.email);
    if (user) {
      throw new ConflictException('Email already exists');
    }
    const { email, name, password } = signupDto;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await this.usersService.create(email, name, passwordHash);
    return this.buildToken(newUser.id, newUser.email);
  }

async signin(signinDto: SigninDto) {
    const user = await this.usersService.findByEmail(signinDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(signinDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildToken(user.id, user.email);
    
  }
  private buildToken(userId: string, email: string) {
  const payload = { sub: userId, email };
  return { access_token: this.jwtService.sign(payload) };
}
}