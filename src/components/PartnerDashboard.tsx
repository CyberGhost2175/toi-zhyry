import { Plus, TrendingUp, Users, Star, Calendar, Eye, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ImageWithFallback } from "./ImageWithFallback";

interface PartnerDashboardProps {
  onNavigate: (page: string) => void;
}

export function PartnerDashboard({ onNavigate }: PartnerDashboardProps) {
  const statsData = [
    { month: 'Июн', bookings: 12, revenue: 450 },
    { month: 'Июл', bookings: 18, revenue: 680 },
    { month: 'Авг', bookings: 24, revenue: 920 },
    { month: 'Сен', bookings: 21, revenue: 780 },
    { month: 'Окт', bookings: 28, revenue: 1050 },
    { month: 'Ноя', bookings: 15, revenue: 580 },
  ];

  const services = [
    {
      name: "Ресторан «Алатау»",
      status: "Активно",
      views: 1234,
      bookings: 28,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1670819917685-f1040e76b9b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxODA2NDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      name: "Банкетный зал «Достык»",
      status: "Активно",
      views: 876,
      bookings: 15,
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1758810411514-1cffb1420a4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMGNlbGVicmF0aW9uJTIwcGFydHl8ZW58MXx8fHwxNzYxOTAxMzYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const bookings = [
    {
      id: "#12345",
      client: "Айжан С.",
      service: "Ресторан «Алатау»",
      date: "15 декабря 2025",
      guests: 150,
      amount: "450 000 ₸",
      status: "Подтверждено",
    },
    {
      id: "#12346",
      client: "Нурлан И.",
      service: "Ресторан «Алатау»",
      date: "20 декабря 2025",
      guests: 120,
      amount: "360 000 ₸",
      status: "Новый",
    },
    {
      id: "#12347",
      client: "Гульнара А.",
      service: "Банкетный зал «Достык»",
      date: "25 декабря 2025",
      guests: 80,
      amount: "240 000 ₸",
      status: "Новый",
    },
  ];

  const reviews = [
    {
      client: "Айжан Сагинова",
      service: "Ресторан «Алатау»",
      rating: 5,
      text: "Потрясающий ресторан! Все гости были в восторге!",
      date: "15 октября 2025",
    },
    {
      client: "Нурлан Ибрагимов",
      service: "Ресторан «Алатау»",
      rating: 5,
      text: "Отличное место для проведения банкетов. Рекомендую!",
      date: "3 октября 2025",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Подтверждено':
        return 'bg-green-100 text-green-700';
      case 'Новый':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#222222] mb-2">Кабинет партнёра</h1>
            <p className="text-gray-600">Управляйте вашими услугами и заказами</p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('home')}
            className="rounded-full"
          >
            На главную
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Доход (месяц)</CardTitle>
              <TrendingUp className="w-5 h-5 text-[#00AFAE]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">1 050 000 ₸</div>
              <p className="text-green-600">+23% к прошлому месяцу</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Бронирований</CardTitle>
              <Calendar className="w-5 h-5 text-[#FFD700]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">28</div>
              <p className="text-green-600">+15% к прошлому месяцу</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Средний рейтинг</CardTitle>
              <Star className="w-5 h-5 text-[#FFD700]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">4.8</div>
              <p className="text-gray-600">Из 127 отзывов</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Просмотры</CardTitle>
              <Eye className="w-5 h-5 text-[#00AFAE]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">2 110</div>
              <p className="text-green-600">+8% к прошлому месяцу</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#222222]">Доход</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#00AFAE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#222222]">Бронирования</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#FFD700" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl">
            <TabsTrigger value="services" className="rounded-lg">Мои услуги</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg">Бронирования</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg">Календарь</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">Отзывы</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#222222]">Мои услуги</CardTitle>
                <Button className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить услугу
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-[#222222]">{service.name}</h3>
                          <Badge className="bg-green-100 text-green-700">{service.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{service.views} просмотров</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{service.bookings} бронирований</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                            <span>{service.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full">
                        Редактировать
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#222222]">Текущие бронирования</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Услуга</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Гостей</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="text-[#00AFAE]">{booking.id}</TableCell>
                        <TableCell>{booking.client}</TableCell>
                        <TableCell>{booking.service}</TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>{booking.guests}</TableCell>
                        <TableCell className="text-[#00AFAE]">{booking.amount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="rounded-full">
                            Детали
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#222222]">Календарь занятости</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Календарь занятости в разработке</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#222222]">Отзывы клиентов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-[#222222] mb-1">{review.client}</h4>
                          <p className="text-gray-500">{review.service}</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{review.text}</p>
                      <p className="text-gray-400">{review.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
