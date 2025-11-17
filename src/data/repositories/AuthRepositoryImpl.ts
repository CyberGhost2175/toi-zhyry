import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { RegisterUserData, LoginUserData, AuthResponse } from '../../domain/entities/User';
import { AuthApi } from '../api/AuthApi';

export class AuthRepositoryImpl implements AuthRepository {
    constructor(private authApi: AuthApi) {}

    async register(data: RegisterUserData): Promise<AuthResponse> {
        return this.authApi.register(data);
    }

    async login(data: LoginUserData): Promise<AuthResponse> {
        return this.authApi.login(data);
    }

    async logout(): Promise<void> {
        return this.authApi.logout();
    }

    async getCurrentUser(): Promise<AuthResponse | null> {
        return this.authApi.getCurrentUser();
    }
}