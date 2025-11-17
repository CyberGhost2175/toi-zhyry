export interface User {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RegisterUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
}

export interface LoginUserData {
    email: string;
    password: string;
}

export interface AuthResponse {
    // Формат для login
    user?: User;
    token?: string;

    // Формат для register (ваш текущий бэкенд)
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date;
    message?: string;
}