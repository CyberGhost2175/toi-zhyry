import { AuthRepository } from '../repositories/AuthRepository';
import { LoginUserData, AuthResponse } from '../entities/User';

export class LoginUseCase {
    constructor(private authRepository: AuthRepository) {}

    async execute(data: LoginUserData): Promise<AuthResponse> {
        // Валидация
        this.validateLoginData(data);

        // Вход через репозиторий
        const response = await this.authRepository.login(data);

        // Сохранение токена
        if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    }

    private validateLoginData(data: LoginUserData): void {
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Некорректный email адрес');
        }

        if (!data.password) {
            throw new Error('Пароль не может быть пустым');
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Пустой export чтобы файл стал модулем
export {};