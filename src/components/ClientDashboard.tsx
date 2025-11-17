import { ShoppingBag, Heart, Bell, Settings, Calendar, MapPin, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ImageWithFallback } from "./ImageWithFallback";

interface ClientDashboardProps {
  onNavigate: (page: string) => void;
}

export function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const orders = [
    {
      id: "#12345",
      service: "Ресторан «Алатау»",
      date: "15 декабря 2025",
      status: "Подтверждено",
      price: "450 000 ₸",
      image: "https://images.unsplash.com/photo-1670819917685-f1040e76b9b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxODA2NDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: "#12344",
      service: "Свадебный кортеж",
      date: "15 декабря 2025",
      status: "Ожидает оплаты",
      price: "70 000 ₸",
      image: "https://images.unsplash.com/photo-1628691193240-be25a90b0eae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2FycyUyMGNvbnZveXxlbnwxfHx8fDE3NjE4OTY5OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: "#12343",
      service: "Тамада Айгерим",
      date: "10 ноября 2025",
      status: "Завершено",
      price: "100 000 ₸",
      image: "https://images.unsplash.com/photo-1657702776262-0466e88e5e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwaG9zdCUyME1DfGVufDF8fHx8MTc2MTkwMTM1OXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const favorites = [
    {
      title: "Декор и оформление зала",
      rating: 4.7,
      price: "от 100 000 ₸",
      image: "https://images.unsplash.com/photo-1664530140722-7e3bdbf2b870?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZGVjb3JhdGlvbiUyMGZsb3dlcnN8ZW58MXx8fHwxNzYxODk2OTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      title: "Свадебная фото-видео съёмка",
      rating: 4.9,
      price: "от 120 000 ₸",
      image: "https://images.unsplash.com/photo-1661668724998-fd8c24e1cd1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaGVyJTIwY2FtZXJhfGVufDF8fHx8MTc2MTg5Njk5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const notifications = [
    {
      title: "Новое сообщение от партнёра",
      text: "Ресторан «Алатау» подтвердил вашу бронь на 15 декабря",
      time: "2 часа назад",
      unread: true,
    },
    {
      title: "Напоминание о мероприятии",
      text: "До вашего мероприятия осталось 7 дней",
      time: "1 день назад",
      unread: true,
    },
    {
      title: "Скидка 15% на декор",
      text: "Специальное предложение для вас от партнёра",
      time: "3 дня назад",
      unread: false,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Подтверждено':
        return 'bg-green-100 text-green-700';
      case 'Ожидает оплаты':
        return 'bg-yellow-100 text-yellow-700';
      case 'Завершено':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[#222222]">Личный кабинет</h1>
          <Button
            variant="outline"
            onClick={() => onNavigate('home')}
            className="rounded-full"
          >
            На главную
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {/* User Profile */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white mx-auto mb-3">
                  <span className="text-2xl">АС</span>
                </div>
                <h3 className="text-[#222222] mb-1">Айжан Сагинова</h3>
                <p className="text-gray-500">aizan@example.com</p>
              </div>

              {/* Menu */}
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00AFAE]/10 text-[#00AFAE]">
                  <ShoppingBag className="w-5 h-5" />
                  <span>Мои заказы</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-[#F9F9F9] transition-colors">
                  <Heart className="w-5 h-5" />
                  <span>Избранное</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-[#F9F9F9] transition-colors">
                  <Bell className="w-5 h-5" />
                  <span>Уведомления</span>
                  <Badge className="ml-auto bg-red-500">3</Badge>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-[#F9F9F9] transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Настройки</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="bg-white p-1 rounded-xl">
                <TabsTrigger value="orders" className="rounded-lg">Мои заказы</TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg">Избранное</TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-lg">Уведомления</TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-[#222222]">История заказов</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Услуга</TableHead>
                          <TableHead>Дата мероприятия</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Сумма</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <ImageWithFallback
                                    src={order.image}
                                    alt={order.service}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="text-[#222222]">{order.service}</p>
                                  <p className="text-gray-500">{order.id}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{order.date}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[#00AFAE]">{order.price}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" className="rounded-full">
                                Детали
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Favorites Tab */}
              <TabsContent value="favorites">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-[#222222] mb-6">Избранные услуги</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favorites.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video relative">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <button className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="text-[#222222] mb-2">{item.title}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                              <span>{item.rating}</span>
                            </div>
                            <span className="text-[#00AFAE]">{item.price}</span>
                          </div>
                          <Button 
                            className="w-full mt-4 bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full"
                            onClick={() => onNavigate('service-detail')}
                          >
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-[#222222] mb-6">Уведомления</h2>
                  <div className="space-y-4">
                    {notifications.map((notification, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border ${
                          notification.unread
                            ? 'bg-[#00AFAE]/5 border-[#00AFAE]/20'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-[#222222]">{notification.title}</h4>
                              {notification.unread && (
                                <div className="w-2 h-2 bg-[#00AFAE] rounded-full" />
                              )}
                            </div>
                            <p className="text-gray-600 mb-2">{notification.text}</p>
                            <p className="text-gray-400">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
