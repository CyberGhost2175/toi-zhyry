import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./ImageWithFallback";

interface ServiceCardProps {
  title: string;
  image: string;
  rating: number;
  reviews: number;
  price: string;
  onNavigate?: () => void;
}

export function ServiceCard({ title, image, rating, reviews, price, onNavigate }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
          <Heart className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      <div className="p-5">
        <h3 className="text-[#222222] mb-2 line-clamp-2 min-h-[3rem]">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
            <span className="text-[#222222]">{rating}</span>
          </div>
          <span className="text-gray-500">({reviews})</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#00AFAE]">{price}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onNavigate}
              size="sm"
              className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full"
            >
              Подробнее
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
