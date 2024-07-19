import Connections from "../Connections";

const About = () => {
  return (
    <section id="About" className="h-screen flex flex-col pt-20">
      <div className="flex flex-col justify-center items-center gap-4">
        <span className="text-xl md:text-3xl">Hello, I am</span>
        <div className="text-3xl md:text-5xl font-semibold flex flex-col md:flex-row gap-3 items-center">
          <span>Vamsi Krishna</span>
          <span>Chandaluri</span>
        </div>
        <span className="text-2xl md:text-4xl font-semibold">
          Front End Developer
        </span>
        <Connections />
      </div>
    </section>
  );
};

export default About;
