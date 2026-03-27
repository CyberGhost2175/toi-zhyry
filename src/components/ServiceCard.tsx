import { Star, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./ImageWithFallback";
import type { CatalogService } from "../domain/entities/Service";
import { getImageUrl } from "../utils/imageUrl";
import { formatPriceByType } from "../utils/priceType";

interface ServiceCardPropsFromApi {
  service: CatalogService;
  onNavigate?: (serviceId: string) => void;
  onToggleFavorite?: (serviceId: string, isFavorite: boolean) => void;
}

interface ServiceCardPropsLegacy {
  title: string;
  image: string;
  rating: number;
  reviews: number;
  price: string;
  onNavigate?: () => void;
}

type ServiceCardProps = ServiceCardPropsFromApi | ServiceCardPropsLegacy;

function isApiProps(props: ServiceCardProps): props is ServiceCardPropsFromApi {
  return 'service' in props && props.service != null;
}

export function ServiceCard(props: ServiceCardProps) {
  const isApi = isApiProps(props);
  const title = isApi ? props.service.name : props.title;
  const image = isApi ? getImageUrl(props.service.thumbnail || props.service.images?.[0] || '') : getImageUrl(props.image);
  const rating = isApi ? props.service.rating : props.rating;
  const reviews = isApi ? props.service.reviewsCount : props.reviews;
  const price = isApi
    ? formatPriceByType(props.service.priceFrom, props.service.priceTo, props.service.priceType)
    : props.price;
  const onNavigate = isApi
    ? () => props.onNavigate?.(props.service.id)
    : props.onNavigate;
  const isFavorite = isApi ? props.service.isFavorite : false;
  const handleHeartClick = isApi && props.onToggleFavorite
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        props.onToggleFavorite?.(props.service.id, props.service.isFavorite);
      }
    : (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          type="button"
          onClick={handleHeartClick}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"
          aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-600'
            }`}
          />
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
