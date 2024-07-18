import { MaxWidthWrapper } from "../common/MaxWidthWrapper";
import Connections from "../Connections";

const About = () => {
  return (
    <MaxWidthWrapper>
      <section
        id="about"
        className="bg-background flex flex-col justify-center items-center mt-20 mb-60"
      >
        <div className="flex flex-col justify-center items-center gap-4">
          <span className="text-xl md:text-2xl">Hello, I am</span>
          <span className="text-3xl md:text-5xl font-semibold">
            Vamsi Krishna Chandaluri
          </span>
          <span className="text-2xl md:text-4xl font-semibold">
            Front End Developer
          </span>
          <Connections />
        </div>
      </section>
    </MaxWidthWrapper>
  );
};

export default About;
