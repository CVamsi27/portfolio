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
import Image from "next/image";
import { SKILLS } from "@/lib/const";

const Skills = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 1500, stopOnInteraction: true }),
  );

  return (
    <section
      id="Skills"
      className="w-full flex flex-col gap-10 justify-center items-center pt-10"
    >
      <span className="mt-20 text-3xl md:text-5xl font-semibold text-center">
        Skills
      </span>

      <Carousel
        plugins={[plugin.current]}
        className="w-4/6 md:w-5/6"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {SKILLS.map((data, index) => (
            <CarouselItem key={index} className="basis-1/10 w-40 h-40">
              <div className="p-1">
                <Card className="border-0">
                  <CardContent className="flex flex-col gap-3 aspect-square items-center justify-center p-6">
                    <div className="h-8 sm:h-10">
                      <Image
                        src={data.img}
                        alt={data.alt}
                        width={40}
                        height={40}
                        className="h-full w-auto rounded-lg"
                      />
                    </div>
                    <p className="text-foreground text-sm sm:text-lg">
                      {data.alt}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
};
export default Skills;
