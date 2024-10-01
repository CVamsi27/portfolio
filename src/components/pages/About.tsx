import Connections from "../Connections";
import Image from "next/image";
import DEV from "../../../public/SE.png";

const About = () => {
  return (
    <section id="About" className="flex flex-col pt-8">
      <div className="grid lg:grid-cols-2 gap-2">
        <div className="flex flex-col gap-12 mx-8 mt-12">
          <div className="flex flex-col gap-4">
            <span className="text-xl text-primary">People call me:</span>
            <span className="text-3xl md:text-5xl font-semibold">
              Vamsi Krishna Chandaluri
            </span>
            <span className="text-xl text-primary">A small into:</span>
            <span className="text-2xl md:text-base font-semibold">
              Hey there! I'm a Full Stack Developer who loves creating awesome
              web experiences. I work with everything from HTML, CSS, and React
              on the front end to Java, Python, and databases like MongoDB and
              PostgreSQL on the back end. I also dabble in Web 3.0 and love
              keeping up with the latest tech trends. Let's build something
              amazing together!
            </span>
          </div>
          <span className="text-xl text-primary text-center">
            To interact with me:
          </span>
          <Connections />
          <a
            href="/VamsiKrishna_Resume.pdf"
            download="VamsiKrishna_Resume"
            className="bg-primary font-semibold text-xl text-primary-foreground text-center px-4 py-2 rounded-lg"
          >
            Here's my Resume
          </a>
        </div>
        <div className="flex justify-center">
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
