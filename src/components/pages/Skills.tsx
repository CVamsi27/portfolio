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
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { SKILLS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

const Skills = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true, playOnInit: false }),
  );
  const [api, setApi] = React.useState<CarouselApi>();

  // Autoplay is motion — honor prefers-reduced-motion by never starting it.
  // (CSS transitions elsewhere are already zeroed by the global media query.)
  // Play via the carousel API once the plugin is registered.
  React.useEffect(() => {
    if (!api || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    api.plugins().autoplay?.play();
  }, [api]);

  return (
    <section id="Skills" data-chapter-index="03" className="w-full px-6 py-24 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          eyebrow="Stack"
          title="Skills"
          description="The tools I reach for across the stack — TypeScript end to end, with production quality gates and cloud delivery."
        />

        <Reveal>
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            setApi={setApi}
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {SKILLS.map((data, index) => (
                <CarouselItem
                  key={index}
                  className="basis-1/3 sm:basis-1/4 md:basis-1/5"
                >
                  <Card className="border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group">
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
        </Reveal>
      </div>
    </section>
  );
};

export default Skills;
