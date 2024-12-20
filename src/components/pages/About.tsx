"use client";
import Connections from "../Connections";
import Image from "next/image";
import DEV from "../../../public/SE.png";
import { useEffect, useState } from "react";
import { getUniqueLanguageCombination } from "@/lib/utils";

const About = () => {
  const [nameCombination, setNameCombination] = useState({
    vamsi: { word: "Vamsi", language: "English" },
    krishna: { word: "Krishna", language: "English" },
    chandaluri: { word: "Chandaluri", language: "English" },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const { randomVamsi, randomKrishna, randomChandaluri } =
        getUniqueLanguageCombination();
      setNameCombination({
        vamsi: randomVamsi,
        krishna: randomKrishna,
        chandaluri: randomChandaluri,
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="About" className="flex flex-col">
      <div className="grid xl:grid-cols-2 gap-2 mt-8 text-center lg:text-left">
        <div className="flex flex-col gap-12 mx-8">
          <div className="flex flex-col gap-4">
            <span className="text-xl text-primary">People call me:</span>
            <span className="text-3xl md:text-5xl font-semibold ">
              {nameCombination.vamsi.word} {nameCombination.krishna.word}{" "}
              {nameCombination.chandaluri.word}
            </span>
            <span className="text-xl text-primary">A small into:</span>
            <span className="text-base font-semibold">
              Hey there! I&apos;m a Full Stack Developer who loves creating
              awesome web experiences. I work with everything from HTML, CSS,
              and React on the front end to Java, Python, and databases like
              MongoDB and PostgreSQL on the back end. I also dabble in Web 3.0
              and love keeping up with the latest tech trends. Let&apos;s build
              something amazing together!
            </span>
          </div>
          <span className="text-xl text-primary text-center">
            To interact with me:
          </span>
          <Connections />
          <a
            href="/VamsiKrishna_Resume.pdf"
            download="VamsiKrishna_Resume"
            className="bg-primary hover:bg-border font-semibold text-xl text-primary-foreground hover:text-primary text-center px-4 py-2 rounded-lg"
          >
            Here&apos;s my Resume
          </a>
        </div>
        <div className="hidden xl:flex justify-center">
          <Image
            src={DEV}
            alt="Developer"
            className="h-full w-auto items-center"
          />
        </div>
      </div>
    </section>
  );
};

export default About;
