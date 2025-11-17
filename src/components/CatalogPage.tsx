import { Filter, ChevronDown } from "lucide-react";
import { ServiceCard } from "./ServiceCard";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface CatalogPageProps {
  onNavigate: (page: string) => void;
}

export function CatalogPage({ onNavigate }: CatalogPageProps) {
  const services = [
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
    {
      title: "Банкетный зал «Достык» - до 200 гостей",
      image: "https://images.unsplash.com/photo-1670819917685-f1040e76b9b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxODA2NDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.6,
      reviews: 112,
      price: "от 18 000 ₸",
    },
    {
      title: "Кортеж из 5 машин Mercedes S-класс",
      image: "https://images.unsplash.com/photo-1628691193240-be25a90b0eae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2FycyUyMGNvbnZveXxlbnwxfHx8fDE3NjE4OTY5OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.9,
      reviews: 76,
      price: "от 70 000 ₸",
    },
    {
      title: "Тамада с DJ и живой музыкой",
      image: "https://images.unsplash.com/photo-1657702776262-0466e88e5e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwaG9zdCUyME1DfGVufDF8fHx8MTc2MTkwMTM1OXww&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.8,
      reviews: 145,
      price: "от 100 000 ₸",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-[#222222] mb-8">Каталог услуг</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#222222]">Фильтры</h3>
                <Button variant="ghost" size="sm" className="text-[#00AFAE]">
                  Сбросить
                </Button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Категория</h4>
                <div className="space-y-2">
                  {['Рестораны', 'Кортежи', 'Тамады', 'Декораторы', 'Фото-видео'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox />
                      <span className="text-gray-600">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Цена</h4>
                <Slider defaultValue={[0, 300000]} max={500000} step={10000} className="mb-2" />
                <div className="flex items-center justify-between text-gray-600">
                  <span>0 ₸</span>
                  <span>500 000 ₸</span>
                </div>
              </div>

              {/* City */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Город</h4>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="almaty">Алматы</SelectItem>
                    <SelectItem value="astana">Астана</SelectItem>
                    <SelectItem value="shymkent">Шымкент</SelectItem>
                    <SelectItem value="karaganda">Караганда</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Рейтинг</h4>
                <div className="space-y-2">
                  {[5, 4, 3].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox />
                      <div className="flex items-center gap-1">
                        {[...Array(rating)].map((_, i) => (
                          <span key={i} className="text-[#FFD700]">★</span>
                        ))}
                        <span className="text-gray-600 ml-1">и выше</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full">
                Применить фильтры
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between">
              <p className="text-gray-600">Найдено {services.length} услуг</p>
              <Select defaultValue="popular">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">По популярности</SelectItem>
                  <SelectItem value="price-asc">Сначала дешевле</SelectItem>
                  <SelectItem value="price-desc">Сначала дороже</SelectItem>
                  <SelectItem value="rating">По рейтингу</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <ServiceCard
                  key={index}
                  {...service}
                  onNavigate={() => onNavigate('service-detail')}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" className="rounded-full">
                Назад
              </Button>
              {[1, 2, 3, 4, 5].map((page) => (
                <Button
                  key={page}
                  variant={page === 1 ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full w-10 ${
                    page === 1 ? 'bg-[#00AFAE] hover:bg-[#00AFAE]/90' : ''
                  }`}
                >
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="rounded-full">
                Далее
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
