"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { FORM_DETAILS, PERSONAL_DETAILS } from "@/lib/const";
import Connections from "../Connections";
import { Textarea } from "../ui/textarea";

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Provide a valid mail id.",
  }),
  message: z.string(),
});

const Contact = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };

      const response = await fetch(`/api/contact`, requestOptions);
      const res = await response.json();

      if (res.status === 200) {
        toast({
          title: "Message sent successfully!",
        });
        form.reset();
      } else {
        toast({
          title: "Message sending failed!",
        });
      }
    } catch (error) {
      toast({
        title: JSON.stringify(error),
      });
    }
  };

  return (
    <section
      id="Contact"
      className="min-h-screen w-full flex flex-col gap-6 md:gap-10 justify-center px-4 md:px-8 py-12 md:py-20 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-pink-400/10 dark:bg-pink-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-400/10 dark:bg-blue-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 animate-fade-in">
          <span className="gradient-text">Get In Touch</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          <div className="flex flex-col gap-6 md:gap-8 animate-slide-in-left">
            <div className="bg-card/80 backdrop-blur-sm border-2 border-border rounded-lg p-4 md:p-6 shadow-lg hover-lift">
              <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4 md:mb-6">Contact Information</h3>
              <div className="flex flex-col gap-3 md:gap-4">
                {PERSONAL_DETAILS.map((value, index) => (
                  <div key={index} className="flex gap-3 md:gap-4 items-center group">
                    <span className="text-primary w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-secondary to-secondary/80 rounded-full p-2 md:p-3 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <value.icon />
                    </span>
                    <span className="text-foreground text-sm md:text-base break-all">{value.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm border-2 border-border rounded-lg p-4 md:p-6 shadow-lg hover-lift flex-1 flex flex-col">
              <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4 md:mb-6">Connect With Me</h3>
              <div className="flex-1 flex items-center">
                <Connections />
              </div>
            </div>
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm border-2 border-border rounded-lg p-4 md:p-6 shadow-lg hover-lift animate-slide-in-right">
            <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4 md:mb-6">Send a Message</h3>
            <Form {...form}>
              <form
                method="POST"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-6"
              >
                {FORM_DETAILS.map((value, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={value.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium text-sm md:text-base">{value.label}</FormLabel>
                        <FormControl>
                          {value.name === "message" ? (
                            <Textarea
                              className="border-2 border-border bg-background/50 backdrop-blur-sm focus:border-primary transition-all duration-300 min-h-24 md:min-h-32 text-sm md:text-base hover:shadow-md"
                              placeholder="Your message here..."
                              {...field}
                            />
                          ) : (
                            <Input
                              className="border-2 border-border bg-background/50 backdrop-blur-sm focus:border-primary transition-all duration-300 text-sm md:text-base hover:shadow-md"
                              placeholder={`Enter your ${value.name}...`}
                              {...field}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <Button type="submit" className="w-full bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground font-semibold py-5 md:py-6 text-base md:text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  SEND MESSAGE
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Contact;
