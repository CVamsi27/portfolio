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
    message: "Provide a valid email address.",
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
      className="w-full px-6 py-20 bg-secondary/30"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-10 animate-fade-in">
          Contact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col gap-8 animate-slide-in-left">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Get in Touch
              </h3>
              <div className="flex flex-col gap-3">
                {PERSONAL_DETAILS.map((value, index) => (
                  <a
                    key={index}
                    href={value.value.includes("@") ? `mailto:${value.value}` : value.value.includes("+") ? `tel:${value.value}` : `https://maps.google.com/?q=${encodeURIComponent(value.value)}`}
                    target={value.value.includes("@") || value.value.includes("+") ? undefined : "_blank"}
                    rel={value.value.includes("@") || value.value.includes("+") ? undefined : "noopener noreferrer"}
                    className="flex gap-3 items-center group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground group-hover:text-foreground group-hover:border-accent-foreground/10 transition-all shrink-0">
                      <value.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors break-all">
                      {value.value}
                    </span>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Connect
              </h3>
              <Connections />
            </div>
          </div>

          <div className="animate-slide-in-right">
            <Form {...form}>
              <form
                method="POST"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {FORM_DETAILS.map((value, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={value.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          {value.label}
                        </FormLabel>
                        <FormControl>
                          {value.name === "message" ? (
                            <Textarea
                              className="min-h-[120px] resize-none"
                              placeholder="Your message..."
                              {...field}
                            />
                          ) : (
                            <Input
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
                <Button type="submit" className="w-full">
                  Send Message
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
