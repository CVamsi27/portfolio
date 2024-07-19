import { WORK_EXPERIENCE } from "@/lib/const";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

const Experience = () => {
  return (
    <section
      id="Experience"
      className="w-full flex flex-col gap-10 justify-center pt-20"
    >
      <span className="text-3xl md:text-5xl font-semibold text-center">
        Experiences
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="gap-6 grid grid-cols-1 m-14">
          {WORK_EXPERIENCE.map((value, index) => (
            <Card key={index} className="text-center border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-primary">{value.title}</CardTitle>
                <CardDescription className="text-foreground">
                  {value.company}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl">{value.description}</span>
              </CardContent>
              <CardFooter className="justify-center">
                <span>{value.duration}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
