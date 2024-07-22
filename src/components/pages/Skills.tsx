"use client";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Skills = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 1500, stopOnInteraction: true }),
  );

  return (
    <section
      id="Skills"
      className="w-full flex flex-col gap-10 justify-center items-center pt-20"
    >
      <span className="mt-20 text-3xl md:text-5xl font-semibold text-center">
        Skills
      </span>

      {/* <Carousel
        plugins={[plugin.current]}
        className="w-5/6"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {Array.from({ length: 15 }).map((_, index) => (
            <CarouselItem key={index} className="basis-1/10 w-40 h-40">
              <div className="p-1">
                <Card className="border-0">
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel> */}
    </section>
  );
};
export default Skills;
