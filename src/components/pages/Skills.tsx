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
    Autoplay({ delay: 2000, stopOnInteraction: true }),
  );

  return (
    <section
      id="Skills"
      className="w-full px-6 py-20 bg-secondary/30"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-10 animate-fade-in">
          Skills
        </h2>

        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {SKILLS.map((data, index) => (
              <CarouselItem
                key={index}
                className="basis-1/3 sm:basis-1/4 md:basis-1/5"
              >
                <Card className="border border-border bg-card hover:border-primary/50 transition-all group">
                  <CardContent className="flex flex-col gap-2 aspect-square items-center justify-center p-3">
                    <div className="h-10 w-10 transition-transform duration-200 group-hover:scale-110">
                      <Image
                        src={data.img}
                        alt={data.alt}
                        width={40}
                        height={40}
                        className="h-full w-auto"
                      />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground text-center group-hover:text-foreground transition-colors">
                      {data.alt}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default Skills;
