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
      className="min-h-screen w-full flex flex-col gap-6 md:gap-10 justify-center items-center px-4 md:px-8 py-12 md:py-20 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-blue-400/10 dark:bg-blue-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-purple-400/10 dark:bg-purple-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 animate-fade-in">
          <span className="gradient-text">Technical Skills</span>
        </h2>

        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {SKILLS.map((data, index) => (
              <CarouselItem key={index} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                <div className="p-1 md:p-2">
                  <Card className="border-2 border-border bg-card/80 backdrop-blur-sm hover:border-primary hover:shadow-lg transition-all duration-300 hover-lift group">
                    <CardContent className="flex flex-col gap-2 md:gap-3 aspect-square items-center justify-center p-3 md:p-4">
                      <div className="h-10 sm:h-12 md:h-14 lg:h-16 transition-transform duration-300 group-hover:scale-110 group-hover:animate-float">
                        <Image
                          src={data.img}
                          alt={data.alt}
                          width={64}
                          height={64}
                          className="h-full w-auto rounded-lg"
                        />
                      </div>
                      <p className="text-foreground text-xs sm:text-sm md:text-base font-medium text-center group-hover:text-primary transition-colors duration-300">
                        {data.alt}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex hover:scale-110 transition-transform duration-200" />
          <CarouselNext className="hidden md:flex hover:scale-110 transition-transform duration-200" />
        </Carousel>
      </div>
    </section>
  );
};
export default Skills;
