import { Search, Utensils, Car, Mic, Palette, Camera, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ServiceCard } from "./ServiceCard";
import { KazakhPattern } from "./KazakhPattern";
import { Avatar } from "./ui/avatar";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const categories = [
    { name: "Рестораны", icon: Utensils, color: "#00AFAE" },
    { name: "Кортежи", icon: Car, color: "#FFD700" },
    { name: "Тамады", icon: Mic, color: "#00AFAE" },
    { name: "Декораторы", icon: Palette, color: "#FFD700" },
    { name: "Фото-видео", icon: Camera, color: "#00AFAE" },
  ];

  const popularServices = [
    {
      title: "Ресторан «Алатау» для свадебных торжеств",
      image: "https://images.unsplash.com/photo-1670819917685-f1040e76b9b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxODA2NDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.8,
      reviews: 127,
      price: "от 15 000 ₸",
    },
    {
      title: "Свадебный кортеж премиум класса",
      image: "https://images.unsplash.com/photo-1628691193240-be25a90b0eae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2FycyUyMGNvbnZveXxlbnwxfHx8fDE3NjE4OTY5OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.9,
      reviews: 89,
      price: "от 50 000 ₸",
    },
    {
      title: "Профессиональная тамада Айгерим",
      image: "https://images.unsplash.com/photo-1657702776262-0466e88e5e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwaG9zdCUyME1DfGVufDF8fHx8MTc2MTkwMTM1OXww&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 5.0,
      reviews: 203,
      price: "от 80 000 ₸",
    },
    {
      title: "Декор и оформление банкетного зала",
      image: "https://images.unsplash.com/photo-1664530140722-7e3bdbf2b870?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZGVjb3JhdGlvbiUyMGZsb3dlcnN8ZW58MXx8fHwxNzYxODk2OTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.7,
      reviews: 156,
      price: "от 100 000 ₸",
    },
    {
      title: "Свадебная фото-видео съёмка",
      image: "https://images.unsplash.com/photo-1661668724998-fd8c24e1cd1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaGVyJTIwY2FtZXJhfGVufDF8fHx8MTc2MTg5Njk5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.9,
      reviews: 178,
      price: "от 120 000 ₸",
    },
    {
      title: "Организация банкета «под ключ»",
      image: "https://images.unsplash.com/photo-1758810411514-1cffb1420a4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMGNlbGVicmF0aW9uJTIwcGFydHl8ZW58MXx8fHwxNzYxOTAxMzYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.8,
      reviews: 94,
      price: "от 200 000 ₸",
    },
  ];

  const testimonials = [
    {
      name: "Айжан Сагинова",
      text: "Организовали свадьбу через Toi Zhyry — все прошло идеально! Очень удобный поиск и бронирование.",
      rating: 5,
      avatar: "AS",
    },
    {
      name: "Нурлан Ибрагимов",
      text: "Отличная платформа для поиска услуг. Нашли ресторан и тамаду за один вечер. Рекомендую!",
      rating: 5,
      avatar: "НИ",
    },
    {
      name: "Гульнара Абдуллаева",
      text: "Спасибо за помощь в организации юбилея! Все партнёры профессиональные, цены прозрачные.",
      rating: 5,
      avatar: "ГА",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#00AFAE] to-[#00AFAE]/80 text-white overflow-hidden">
        <KazakhPattern className="absolute inset-0 w-full h-full text-white" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-white mb-4">
              Организуйте незабываемое мероприятие
            </h1>
            <p className="text-white/90 mb-8">
              Найдите лучших партнёров для вашего тоя: рестораны, тамады, декораторы и многое другое
            </p>

            {/* Search */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Что вы ищете?"
                    className="pl-12 h-12 border-gray-200 rounded-xl"
                  />
                </div>
                <Button 
                  className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white h-12 px-8 rounded-xl"
                  onClick={() => onNavigate('catalog')}
                >
                  Найти
                </Button>
              </div>

              {/* Quick Categories */}
              <div className="flex flex-wrap gap-2 mt-4">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => onNavigate('catalog')}
                    className="px-4 py-2 bg-[#F9F9F9] text-[#222222] rounded-full hover:bg-[#00AFAE] hover:text-white transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-[#222222] text-center mb-12">Популярные категории</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.name}
                onClick={() => onNavigate('catalog')}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon className="w-8 h-8" style={{ color: category.color }} />
                </div>
                <h3 className="text-[#222222] text-center">{category.name}</h3>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[#222222]">Популярные услуги</h2>
          <Button 
            variant="ghost" 
            className="text-[#00AFAE]"
            onClick={() => onNavigate('catalog')}
          >
            Смотреть все
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularServices.map((service, index) => (
            <ServiceCard
              key={index}
              {...service}
              onNavigate={() => onNavigate('service-detail')}
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[#222222] text-center mb-12">Отзывы клиентов</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#F9F9F9] p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-[#222222]">{testimonial.name}</h4>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-[#FFD700]">★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-[#00AFAE] to-[#00AFAE]/80 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <KazakhPattern className="absolute inset-0 w-full h-full text-white" />
          
          <div className="relative">
            <h2 className="text-white mb-4">Станьте нашим партнёром</h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к платформе Toi Zhyry и получайте больше заказов для вашего бизнеса
            </p>
            <Button 
              className="bg-white text-[#00AFAE] hover:bg-white/90 rounded-full px-8"
              onClick={() => onNavigate('partner-dashboard')}
            >
              Зарегистрироваться как партнёр
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
