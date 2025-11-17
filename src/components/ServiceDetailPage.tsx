import { Star, MapPin, Calendar, MessageCircle, Share2, Heart, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { ImageWithFallback } from "./ImageWithFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar } from "./ui/avatar";

interface ServiceDetailPageProps {
  onNavigate: (page: string) => void;
}

export function ServiceDetailPage({ onNavigate }: ServiceDetailPageProps) {
  const gallery = [
    "https://images.unsplash.com/photo-1670819917685-f1040e76b9b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxODA2NDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1664530140722-7e3bdbf2b870?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZGVjb3JhdGlvbiUyMGZsb3dlcnN8ZW58MXx8fHwxNzYxODk2OTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1758810411514-1cffb1420a4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMGNlbGVicmF0aW9uJTIwcGFydHl8ZW58MXx8fHwxNzYxOTAxMzYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  ];

  const reviews = [
    {
      name: "Айжан Сагинова",
      avatar: "АС",
      rating: 5,
      date: "15 октября 2025",
      text: "Потрясающий ресторан! Организовали там свадьбу на 150 гостей. Кухня великолепная, обслуживание на высшем уровне. Все гости были в восторге!",
    },
    {
      name: "Нурлан Ибрагимов",
      avatar: "НИ",
      rating: 5,
      date: "3 октября 2025",
      text: "Отличное место для проведения банкетов. Красивый интерьер, вместительный зал, удобная парковка. Рекомендую!",
    },
    {
      name: "Гульнара Абдуллаева",
      avatar: "ГА",
      rating: 4,
      date: "28 сентября 2025",
      text: "Хороший ресторан, но цены немного завышены. В остальном всё понравилось - еда вкусная, персонал вежливый.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => onNavigate('catalog')}
          className="flex items-center gap-2 text-[#00AFAE] mb-6 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Вернуться к каталогу
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
              <div className="aspect-video relative">
                <ImageWithFallback
                  src={gallery[0]}
                  alt="Main image"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary" className="rounded-full bg-white/90 backdrop-blur-sm">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full bg-white/90 backdrop-blur-sm">
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2">
                {gallery.slice(1).map((img, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-[#222222] mb-2">Ресторан «Алатау»</h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                      <span>4.8 (127 отзывов)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-5 h-5 text-[#00AFAE]" />
                      <span>Алматы, ул. Достык 123</span>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="description" className="mt-6">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">Описание</TabsTrigger>
                  <TabsTrigger value="features">Особенности</TabsTrigger>
                  <TabsTrigger value="reviews">Отзывы</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6">
                  <p className="text-gray-600 leading-relaxed">
                    Банкетный зал «Алатау» - это идеальное место для проведения свадеб, юбилеев и корпоративных мероприятий.
                    Наш ресторан расположен в самом центре Алматы и может вместить до 200 гостей.
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-4">
                    Мы предлагаем изысканную казахскую и европейскую кухню, профессиональное обслуживание и элегантный интерьер.
                    В стоимость входит: сервировка стола, базовое меню, напитки, музыкальное сопровождение.
                  </p>
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#00AFAE] rounded-full mt-2" />
                      <div>
                        <p className="text-[#222222]">Вместимость</p>
                        <p className="text-gray-600">До 200 гостей</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#00AFAE] rounded-full mt-2" />
                      <div>
                        <p className="text-[#222222]">Парковка</p>
                        <p className="text-gray-600">Бесплатная на 50 мест</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#00AFAE] rounded-full mt-2" />
                      <div>
                        <p className="text-[#222222]">Кухня</p>
                        <p className="text-gray-600">Казахская, Европейская</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#00AFAE] rounded-full mt-2" />
                      <div>
                        <p className="text-[#222222]">Оборудование</p>
                        <p className="text-gray-600">Проектор, звук, сцена</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white flex-shrink-0">
                            {review.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[#222222]">{review.name}</h4>
                              <span className="text-gray-500">{review.date}</span>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                              ))}
                            </div>
                            <p className="text-gray-600">{review.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Цена за гостя</p>
                <h2 className="text-[#00AFAE]">от 15 000 ₸</h2>
              </div>

              {/* Calendar */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Выберите дату</h4>
                <div className="border border-gray-200 rounded-xl p-2">
                  <CalendarComponent mode="single" className="rounded-md" />
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button className="w-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full h-12">
                  <Calendar className="w-5 h-5 mr-2" />
                  Заброн��ровать
                </Button>
                <Button variant="outline" className="w-full rounded-full h-12">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Связаться с партнёром
                </Button>
              </div>

              {/* Partner Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-[#222222] mb-3">О партнёре</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white">
                    ТА
                  </div>
                  <div>
                    <p className="text-[#222222]">ТОО "Алатау"</p>
                    <p className="text-gray-500">Партнёр с 2020 года</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <div>
                    <p>Рейтинг</p>
                    <p className="text-[#222222]">4.8</p>
                  </div>
                  <div>
                    <p>Заказов</p>
                    <p className="text-[#222222]">350+</p>
                  </div>
                  <div>
                    <p>Ответ</p>
                    <p className="text-[#222222]">&lt;1 час</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
