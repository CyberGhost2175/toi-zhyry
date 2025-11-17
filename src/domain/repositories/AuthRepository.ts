import { RegisterUserData, LoginUserData, AuthResponse } from '../entities/User';

export interface AuthRepository {
    register(data: RegisterUserData): Promise<AuthResponse>;
    login(data: LoginUserData): Promise<AuthResponse>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<AuthResponse | null>;
}

// Пустой export чтобы файл стал модулем
export {};