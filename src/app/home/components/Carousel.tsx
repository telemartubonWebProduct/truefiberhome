import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface CarouselProps {
  banners: any[];
}

const Carousel = ({ banners }: CarouselProps) => {
  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-full mx-auto">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop={true}
        className="w-full"
        a11y={{
          prevSlideMessage: 'สไลด์ก่อนหน้า',
          nextSlideMessage: 'สไลด์ถัดไป',
        }}
      >
        {banners.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full">
              <picture>
                {/* Mobile version could be derived from the same imageUrl or a different field. We'll use the same for now */}
                <source
                  media="(max-width: 768px)"
                  srcSet={slide.imageUrl}
                />
                <img
                  src={slide.imageUrl}
                  alt={slide.title || "Banner"}
                  width={1440}
                  height={600}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  className="w-full object-cover"
                  style={{ aspectRatio: '12/5' }}
                />
              </picture>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Carousel;