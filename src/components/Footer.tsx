import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-xl flex items-center justify-center">
                <span className="text-white">TŽ</span>
              </div>
              <span className="text-[#222222]">Toi Zhyry</span>
            </div>
            <p className="text-gray-600 mb-4">
              Платформа для организации незабываемых мероприятий в Казахстане
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-[#F9F9F9] rounded-full flex items-center justify-center hover:bg-[#00AFAE] hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-[#F9F9F9] rounded-full flex items-center justify-center hover:bg-[#00AFAE] hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-[#F9F9F9] rounded-full flex items-center justify-center hover:bg-[#00AFAE] hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[#222222] mb-4">Быстрые ссылки</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  О нас
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  Каталог услуг
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  Для партнёров
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  Блог
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[#222222] mb-4">Поддержка</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  Помощь
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  Политика конфиденциальности
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  Условия использования
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#00AFAE] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[#222222] mb-4">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-600">
                <Phone className="w-5 h-5 text-[#00AFAE] flex-shrink-0 mt-0.5" />
                <span>+7 (777) 123-45-67</span>
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <Mail className="w-5 h-5 text-[#00AFAE] flex-shrink-0 mt-0.5" />
                <span>info@toizhyry.kz</span>
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-5 h-5 text-[#00AFAE] flex-shrink-0 mt-0.5" />
                <span>Алматы, Казахстан</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2025 Toi Zhyry. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
