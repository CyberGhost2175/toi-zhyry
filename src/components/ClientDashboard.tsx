import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, LogOut, Edit2, Save, X, ArrowLeft, Key, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { authorizedFetch } from '../utils/authorizedFetch';

interface UserProfileProps {
    onNavigate: (page: string, state?: { serviceId?: string }) => void;
}

interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    role: string;
    emailVerified: boolean;
    lastLogin: string;
    createdAt: string;
}

export function UserProfile({ onNavigate }: UserProfileProps) {
    const { logout } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<Partial<UserData>>({});
    const [isSaving, setIsSaving] = useState(false);

    const [passwordCurrent, setPasswordCurrent] = useState('');
    const [passwordNew, setPasswordNew] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            if (!token) {
                throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
            }

            const response = await authorizedFetch('/api/v1/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
                }
                throw new Error(`Ошибка: ${response.status}`);
            }

            const data = await response.json();
            setUserData(data);
            setEditedData(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        onNavigate('home');
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedData({
            email: userData?.email,
            firstName: userData?.firstName,
            lastName: userData?.lastName,
            phone: userData?.phone,
            city: userData?.city,
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedData(userData || {});
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('authToken');
            const payload = {
                firstName: editedData.firstName ?? userData?.firstName ?? '',
                lastName: editedData.lastName ?? userData?.lastName ?? '',
                phone: editedData.phone ?? userData?.phone ?? '',
                city: editedData.city ?? userData?.city ?? '',
            };

            const response = await authorizedFetch('/api/v1/users/me', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'Не удалось обновить профиль');
            }

            const updatedData = await response.json();
            setUserData(updatedData);
            setEditedData(updatedData);
            setIsEditing(false);
            alert('✅ Профиль успешно обновлён!');
        } catch (err) {
            alert('❌ ' + (err instanceof Error ? err.message : 'Произошла ошибка при обновлении'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);
        if (passwordNew !== passwordConfirm) {
            setPasswordError('Новый пароль и подтверждение не совпадают');
            return;
        }
        if (!passwordNew || passwordNew.length < 8) {
            setPasswordError('Новый пароль должен быть не менее 8 символов');
            return;
        }
        try {
            setIsChangingPassword(true);
            const token = localStorage.getItem('authToken');
            const response = await authorizedFetch('/api/v1/users/me/password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordCurrent,
                    newPassword: passwordNew,
                }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'Не удалось сменить пароль');
            }
            setPasswordSuccess(true);
            setPasswordCurrent('');
            setPasswordNew('');
            setPasswordConfirm('');
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : 'Ошибка смены пароля');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const openDeleteDialog = () => {
        setDeletePassword('');
        setDeleteReason('');
        setDeleteError(null);
        setDeleteConfirmOpen(false);
        setDeleteDialogOpen(true);
    };

    const goToDeleteConfirm = () => {
        if (!deletePassword.trim()) {
            setDeleteError('Введите пароль для подтверждения');
            return;
        }
        setDeleteError(null);
        setDeleteDialogOpen(false);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteProfile = async () => {
        try {
            setIsDeleting(true);
            setDeleteError(null);
            const token = localStorage.getItem('authToken');
            const response = await authorizedFetch('/api/v1/users/me', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: deletePassword,
                    reason: deleteReason || undefined,
                }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'Не удалось удалить профиль');
            }
            setDeleteConfirmOpen(false);
            await logout();
            onNavigate('home');
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Ошибка удаления');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleInputChange = (field: keyof UserData, value: string) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: '#00AFAE' }}></div>
                    <p className="mt-4 text-gray-600 text-center">Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
                    <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#222222] mb-4 text-center">Ошибка</h2>
                    <p className="text-gray-600 text-center mb-6">{error}</p>
                    <div className="flex gap-3">
                        <Button
                            onClick={fetchUserProfile}
                            className="flex-1 h-12 text-white"
                            style={{ backgroundColor: '#00AFAE' }}
                        >
                            Попробовать снова
                        </Button>
                        <Button
                            onClick={() => onNavigate('login')}
                            variant="outline"
                            className="flex-1 h-12"
                        >
                            Войти
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!userData) return null;

    return (
        <div className="min-h-screen bg-[#F9F9F9] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => onNavigate('home')}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    На главную
                </Button>

                {/* Профиль */}
                <>
                {/* Header */}
                <div className="bg-white rounded-t-2xl shadow-sm p-8 border-b-4" style={{ borderColor: '#00AFAE' }}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl" style={{ background: 'linear-gradient(135deg, #00AFAE 0%, #FFD700 100%)' }}>
                                {[userData.firstName?.[0], userData.lastName?.[0]].filter(Boolean).join('').toUpperCase() || userData.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-[#222222]">
                                    {[userData.firstName, userData.lastName].filter(Boolean).join(' ') || userData.email || 'Профиль'}
                                </h1>
                                <p className="text-gray-500 flex items-center mt-1">
                                    <Shield className="w-4 h-4 mr-2" />
                                    {userData.role}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                            {!isEditing ? (
                                <>
                                    <Button
                                        onClick={handleEdit}
                                        className="text-white h-12 px-6"
                                        style={{ backgroundColor: '#00AFAE' }}
                                    >
                                        <Edit2 className="w-5 h-5 mr-2" />
                                        Редактировать
                                    </Button>
                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        className="h-12 px-6 border-red-500 text-red-500 hover:bg-red-50"
                                    >
                                        <LogOut className="w-5 h-5 mr-2" />
                                        Выйти
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="text-white h-12 px-6 bg-green-600 hover:bg-green-700"
                                    >
                                        <Save className="w-5 h-5 mr-2" />
                                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="h-12 px-6"
                                    >
                                        <X className="w-5 h-5 mr-2" />
                                        Отмена
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {userData.emailVerified && (
                        <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mt-4">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Email подтвержден
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-b-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-[#222222] mb-6">Личная информация</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email (только для просмотра, API не позволяет менять через PUT) */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <Mail className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                Email
                            </Label>
                            <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center">
                                {userData.email}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <Phone className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                Телефон
                            </Label>
                            {isEditing ? (
                                <Input
                                    type="tel"
                                    value={editedData.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="h-12"
                                    placeholder="+7 (___) ___-__-__"
                                />
                            ) : (
                                <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center">
                                    {userData.phone}
                                </div>
                            )}
                        </div>

                        {/* First Name */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <User className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                Имя
                            </Label>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={editedData.firstName || ''}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className="h-12"
                                    placeholder="Иван"
                                />
                            ) : (
                                <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center">
                                    {userData.firstName}
                                </div>
                            )}
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <User className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                Фамилия
                            </Label>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={editedData.lastName || ''}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className="h-12"
                                    placeholder="Иванов"
                                />
                            ) : (
                                <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center">
                                    {userData.lastName}
                                </div>
                            )}
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <MapPin className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                Город
                            </Label>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={editedData.city || ''}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className="h-12"
                                    placeholder="Алматы"
                                />
                            ) : (
                                <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center">
                                    {userData.city}
                                </div>
                            )}
                        </div>

                        {/* User ID */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <Shield className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                ID пользователя
                            </Label>
                            <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center font-mono text-sm overflow-x-auto">
                                {userData.id}
                            </div>
                        </div>

                        {/* Last Login */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <Calendar className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                Последний вход
                            </Label>
                            <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center">
                                {userData.lastLogin ? formatDate(userData.lastLogin) : '—'}
                            </div>
                        </div>

                        {/* Created At */}
                        <div className="space-y-2">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                                <Calendar className="w-5 h-5 mr-2" style={{ color: '#00AFAE' }} />
                                Дата регистрации
                            </Label>
                            <div className="text-[#222222] bg-[#F9F9F9] px-4 py-3 rounded-xl h-12 flex items-center">
                                {userData.createdAt ? formatDate(userData.createdAt) : '—'}
                            </div>
                        </div>
                    </div>

                    {/* Statistics Section */}
                    <div className="mt-10 pt-8 border-t-2 border-gray-200">
                        <h2 className="text-xl font-bold text-[#222222] mb-6">Статистика аккаунта</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #00AFAE 0%, #00AFAE 100%)' }}>
                                <p className="text-sm opacity-90 font-medium">Дней с нами</p>
                                <p className="text-4xl font-bold mt-2">
                                    {Math.floor((Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                                </p>
                            </div>
                            <div className="rounded-xl p-6 text-white shadow-lg bg-green-500">
                                <p className="text-sm opacity-90 font-medium">Статус верификации</p>
                                <p className="text-4xl font-bold mt-2">
                                    {userData.emailVerified ? '✓' : '?'}
                                </p>
                            </div>
                            <div className="rounded-xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}>
                                <p className="text-sm opacity-90 font-medium">Роль</p>
                                <p className="text-2xl font-bold mt-2 uppercase">
                                    {userData.role}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Сменить пароль */}
                    <div className="mt-10 pt-8 border-t-2 border-gray-200">
                        <h2 className="text-xl font-bold text-[#222222] mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5" style={{ color: '#00AFAE' }} />
                            Сменить пароль
                        </h2>
                        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                            <div className="space-y-2">
                                <Label>Текущий пароль</Label>
                                <Input
                                    type="password"
                                    value={passwordCurrent}
                                    onChange={(e) => setPasswordCurrent(e.target.value)}
                                    placeholder="Введите текущий пароль"
                                    className="h-12"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Новый пароль</Label>
                                <Input
                                    type="password"
                                    value={passwordNew}
                                    onChange={(e) => setPasswordNew(e.target.value)}
                                    placeholder="Не менее 8 символов"
                                    className="h-12"
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Подтвердите новый пароль</Label>
                                <Input
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    placeholder="Повторите новый пароль"
                                    className="h-12"
                                />
                            </div>
                            {passwordError && (
                                <p className="text-sm text-red-600">{passwordError}</p>
                            )}
                            {passwordSuccess && (
                                <p className="text-sm text-green-600">Пароль успешно изменён.</p>
                            )}
                            <Button
                                type="submit"
                                disabled={isChangingPassword}
                                className="h-12 px-6 text-white"
                                style={{ backgroundColor: '#00AFAE' }}
                            >
                                {isChangingPassword ? 'Сохранение...' : 'Сменить пароль'}
                            </Button>
                        </form>
                    </div>

                    {/* Удалить профиль */}
                    <div className="mt-10 pt-8 border-t-2 border-red-100">
                        <h2 className="text-xl font-bold text-[#222222] mb-4 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Удалить профиль
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                            Удаление аккаунта необратимо (soft delete). Вам потребуется ввести пароль и подтвердить действие.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={openDeleteDialog}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Удалить профиль
                        </Button>
                    </div>
                </div>
                </>
            </div>

            {/* Диалог: ввод пароля и причины для удаления */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удаление профиля</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">
                        Введите пароль и при желании причину удаления. Затем вас попросят подтвердить действие.
                    </p>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Пароль *</Label>
                            <Input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Ваш текущий пароль"
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Причина (необязательно)</Label>
                            <Textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Например: больше не пользуюсь сервисом"
                                rows={3}
                            />
                        </div>
                        {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={goToDeleteConfirm}
                        >
                            Продолжить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Подтверждение: точно удалить? */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Точно удалить профиль?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Ваш аккаунт будет удалён (soft delete). Вы уверены?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteProfile();
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Удаление...' : 'Да, удалить'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}