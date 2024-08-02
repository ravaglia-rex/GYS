import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import { Card, CardContent } from "../ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel"

const CardCarousel: React.FC = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  const cardData = [
    { color: "bg-green-600", message: "A green card means you've passed." },
    { color: "bg-yellow-600", message: "A yellow card means you've not passed the exam." },
    { color: "bg-white", message: "A white card means you need to take that exam." },
  ]

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-xs"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {cardData.map((data, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className={`flex aspect-square items-center justify-center p-6 ${data.color}`}>
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
                <div className="p-4 text-center">
                  <p>{data.message}</p>
                </div>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

export default CardCarousel;