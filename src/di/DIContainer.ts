import { AuthApi } from '../data/api/AuthApi';
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { RegisterUseCase } from '../domain/usecases/RegisterUseCase';
import { LoginUseCase } from '../domain/usecases/LoginUseCase';

// Singleton паттерн для DI контейнера
class DIContainer {
    private static instance: DIContainer;

    private authApi: AuthApi;
    private authRepository: AuthRepositoryImpl;
    private registerUseCase: RegisterUseCase;
    private loginUseCase: LoginUseCase;

    private constructor() {
        // Инициализация зависимостей
        this.authApi = new AuthApi();
        this.authRepository = new AuthRepositoryImpl(this.authApi);
        this.registerUseCase = new RegisterUseCase(this.authRepository);
        this.loginUseCase = new LoginUseCase(this.authRepository);
    }

    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    getRegisterUseCase(): RegisterUseCase {
        return this.registerUseCase;
    }

    getLoginUseCase(): LoginUseCase {
        return this.loginUseCase;
    }

    getAuthRepository(): AuthRepositoryImpl {
        return this.authRepository;
    }
}

export const diContainer = DIContainer.getInstance();