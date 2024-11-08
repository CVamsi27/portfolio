"use client";
import { WORK_EXPERIENCE } from "@/lib/const";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Link from "next/link";

const Experience = () => {
  return (
    <section
      id="Experience"
      className="w-full flex flex-col gap-10 justify-center pt-20"
    >
      <span className="text-3xl md:text-5xl font-semibold text-center">
        Experiences
      </span>
      <div className="grid grid-cols-5 justify-center">
        <div className="gap-6 grid grid-cols-1 col-span-5 lg:col-start-2 lg:col-span-3 m-6 lg:m-14">
          {WORK_EXPERIENCE.map((value, index) => (
            <Link
              key={index}
              href={value.URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className="text-center border-0 bg-card hover:bg-primary hover:text-muted">
                <CardHeader>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <span className="text-lg lg:text-2xl">
                    {value.description}
                  </span>
                  <span>{value.tech}</span>
                </CardContent>
                <CardFooter className="justify-center">
                  <span>{value.duration}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
