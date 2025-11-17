import { AuthRepository } from '../repositories/AuthRepository';
import { RegisterUserData, AuthResponse } from '../entities/User';

export class RegisterUseCase {
    constructor(private authRepository: AuthRepository) {}

    async execute(data: RegisterUserData): Promise<AuthResponse> {
        // Валидация
        this.validateRegistrationData(data);

        // Регистрация через репозиторий
        const response = await this.authRepository.register(data);

        // Сохранение токена
        if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    }

    private validateRegistrationData(data: RegisterUserData): void {
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Некорректный email адрес');
        }

        if (!data.password || data.password.length < 8) {
            throw new Error('Пароль должен содержать минимум 8 символов');
        }

        if (!/[A-Z]/.test(data.password)) {
            throw new Error('Пароль должен содержать хотя бы одну заглавную букву');
        }

        if (!/\d/.test(data.password)) {
            throw new Error('Пароль должен содержать хотя бы одну цифру');
        }

        if (!data.firstName || data.firstName.trim().length < 2) {
            throw new Error('Имя должно содержать минимум 2 символа');
        }

        if (!data.lastName || data.lastName.trim().length < 2) {
            throw new Error('Фамилия должна содержать минимум 2 символа');
        }

        if (!data.phone || !this.isValidPhone(data.phone)) {
            throw new Error('Некорректный номер телефона');
        }

        if (!data.city || data.city.trim().length < 2) {
            throw new Error('Укажите город');
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPhone(phone: string): boolean {
        // Убираем все символы кроме цифр и +
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

        // Проверяем казахстанские номера:
        // +77XXXXXXXXX (12 символов с +7)
        // 87XXXXXXXXX (11 символов с 8)
        // 7XXXXXXXXX (10 символов с 7)
        const kzPhoneRegex = /^(\+7|8|7)[0-9]{10}$/;

        return kzPhoneRegex.test(cleanPhone);
    }
}

// Пустой export чтобы файл стал модулем
export {};