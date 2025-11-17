import { Users, Briefcase, CreditCard, TrendingUp, Search, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const revenueData = [
    { month: 'Июн', revenue: 4500, users: 120 },
    { month: 'Июл', revenue: 6800, users: 145 },
    { month: 'Авг', revenue: 9200, users: 178 },
    { month: 'Сен', revenue: 7800, users: 156 },
    { month: 'Окт', revenue: 10500, users: 203 },
    { month: 'Ноя', revenue: 5800, users: 134 },
  ];

  const categoryData = [
    { name: 'Рестораны', value: 35, color: '#00AFAE' },
    { name: 'Кортежи', value: 20, color: '#FFD700' },
    { name: 'Тамады', value: 15, color: '#00AFAE' },
    { name: 'Декораторы', value: 18, color: '#FFD700' },
    { name: 'Фото-видео', value: 12, color: '#00AFAE' },
  ];

  const recentUsers = [
    { name: "Айжан Сагинова", email: "aizan@example.com", joined: "28 окт 2025", orders: 3, status: "Активный" },
    { name: "Нурлан Ибрагимов", email: "nurlan@example.com", joined: "25 окт 2025", orders: 1, status: "Активный" },
    { name: "Гульнара Абдуллаева", email: "gulnara@example.com", joined: "20 окт 2025", orders: 2, status: "Активный" },
  ];

  const recentPartners = [
    { name: "ТОО «Алатау»", category: "Рестораны", rating: 4.8, orders: 28, status: "Активный" },
    { name: "Свадебный декор «Гүл»", category: "Декораторы", rating: 4.7, orders: 15, status: "Активный" },
    { name: "Кортеж «Люкс»", category: "Кортежи", rating: 4.9, orders: 22, status: "Активный" },
  ];

  const recentPayments = [
    { id: "#12345", client: "Айжан С.", partner: "Ресторан «Алатау»", amount: "450 000 ₸", date: "30 окт 2025", status: "Завершён" },
    { id: "#12346", client: "Нурлан И.", partner: "Кортеж «Люкс»", amount: "70 000 ₸", date: "29 окт 2025", status: "В обработк��" },
    { id: "#12347", client: "Гульнара А.", partner: "Декор «Гүл»", amount: "100 000 ₸", date: "28 окт 2025", status: "Завершён" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Активный':
        return 'bg-green-100 text-green-700';
      case 'Завершён':
        return 'bg-green-100 text-green-700';
      case 'В обработке':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-xl flex items-center justify-center">
                <span className="text-white">TŽ</span>
              </div>
              <div>
                <h3 className="text-[#222222]">Admin Panel</h3>
                <p className="text-gray-500">Toi Zhyry</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00AFAE]/10 text-[#00AFAE]">
                <TrendingUp className="w-5 h-5" />
                <span>Аналитика</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-[#F9F9F9] transition-colors">
                <Users className="w-5 h-5" />
                <span>Пользователи</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-[#F9F9F9] transition-colors">
                <Briefcase className="w-5 h-5" />
                <span>Партнёры</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-[#F9F9F9] transition-colors">
                <CreditCard className="w-5 h-5" />
                <span>Платежи</span>
              </button>
            </nav>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <Button
              variant="outline"
              onClick={() => onNavigate('home')}
              className="w-full rounded-full"
            >
              На главную
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-[#222222] mb-2">Панель администратора</h1>
                <p className="text-gray-600">Обзор платформы Toi Zhyry</p>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input type="text" placeholder="Поиск..." className="pl-10 rounded-full" />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-gray-600">Общий доход</CardTitle>
                  <TrendingUp className="w-5 h-5 text-[#00AFAE]" />
                </CardHeader>
                <CardContent>
                  <div className="text-[#222222] mb-1">44 600 000 ₸</div>
                  <p className="text-green-600">+18% к прошлому месяцу</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-gray-600">Пользователи</CardTitle>
                  <Users className="w-5 h-5 text-[#FFD700]" />
                </CardHeader>
                <CardContent>
                  <div className="text-[#222222] mb-1">1,234</div>
                  <p className="text-green-600">+12% к прошлому месяцу</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-gray-600">Партнёры</CardTitle>
                  <Briefcase className="w-5 h-5 text-[#00AFAE]" />
                </CardHeader>
                <CardContent>
                  <div className="text-[#222222] mb-1">156</div>
                  <p className="text-green-600">+8 новых</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-gray-600">Бронирований</CardTitle>
                  <CreditCard className="w-5 h-5 text-[#FFD700]" />
                </CardHeader>
                <CardContent>
                  <div className="text-[#222222] mb-1">892</div>
                  <p className="text-green-600">+23% к прошлому месяцу</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#222222]">Доход и пользователи</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis yAxisId="left" stroke="#888" />
                      <YAxis yAxisId="right" orientation="right" stroke="#888" />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#00AFAE" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="users" stroke="#FFD700" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#222222]">Категории услуг</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tables */}
            <Tabs defaultValue="users" className="space-y-6">
              <TabsList className="bg-white p-1 rounded-xl">
                <TabsTrigger value="users" className="rounded-lg">По��ьзователи</TabsTrigger>
                <TabsTrigger value="partners" className="rounded-lg">Партнёры</TabsTrigger>
                <TabsTrigger value="payments" className="rounded-lg">Платежи</TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#222222]">Недавние пользователи</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Имя</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Дата регистрации</TableHead>
                          <TableHead>Заказов</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-[#222222]">{user.name}</TableCell>
                            <TableCell className="text-gray-600">{user.email}</TableCell>
                            <TableCell>{user.joined}</TableCell>
                            <TableCell>{user.orders}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Partners Tab */}
              <TabsContent value="partners">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#222222]">Активные партнёры</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Название</TableHead>
                          <TableHead>Категория</TableHead>
                          <TableHead>Рейтинг</TableHead>
                          <TableHead>Заказов</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPartners.map((partner, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-[#222222]">{partner.name}</TableCell>
                            <TableCell>{partner.category}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="text-[#FFD700]">★</span>
                                <span>{partner.rating}</span>
                              </div>
                            </TableCell>
                            <TableCell>{partner.orders}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(partner.status)}>{partner.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#222222]">Недавние платежи</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Клиент</TableHead>
                          <TableHead>Партнёр</TableHead>
                          <TableHead>Сумма</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPayments.map((payment, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-[#00AFAE]">{payment.id}</TableCell>
                            <TableCell>{payment.client}</TableCell>
                            <TableCell>{payment.partner}</TableCell>
                            <TableCell className="text-[#00AFAE]">{payment.amount}</TableCell>
                            <TableCell>{payment.date}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
