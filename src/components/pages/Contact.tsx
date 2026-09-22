"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowUpRight, Mail } from "lucide-react";

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
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

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
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const response = await fetch(`/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await response.json();

      if (res.status === 200) {
        toast({ title: "Message sent successfully!" });
        form.reset();
      } else {
        toast({ title: "Message sending failed!" });
      }
    } catch (error) {
      toast({ title: JSON.stringify(error) });
    }
  };

  return (
    <section id="Contact" className="portfolio-section portfolio-contact-section px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Start a conversation"
          title="Let’s work together"
          description="If you are building something useful and need someone who can move between product thinking and production detail, I would like to hear about it."
        />

        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <Reveal direction="left" className="portfolio-contact-copy">
            <a className="portfolio-contact-email" href="mailto:cvamsik99@gmail.com">
              <Mail className="h-5 w-5" />
              cvamsik99@gmail.com
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <div className="mt-10">
              <p className="portfolio-meta-label">Elsewhere</p>
              <div className="mt-4">
                <Connections />
              </div>
            </div>
            <div className="mt-10 border-t border-[var(--portfolio-rule)] pt-5">
              <p className="portfolio-meta-label">Based in</p>
              <p className="mt-2 text-sm leading-6 text-[var(--portfolio-muted)]">
                Hyderabad, India · open to remote, hybrid, and on-site roles
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 text-sm">
              {PERSONAL_DETAILS.filter((detail) => detail.value.includes("+" ) || detail.value.startsWith("https")).map((detail) => (
                <a
                  key={detail.value}
                  href={detail.value.includes("+") ? `tel:${detail.value}` : detail.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--portfolio-muted)] underline decoration-[var(--portfolio-rule)] underline-offset-4 transition-colors hover:text-[var(--portfolio-accent)]"
                >
                  {detail.value}
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal direction="right" className="portfolio-contact-form">
            <Form {...form}>
              <form method="POST" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {FORM_DETAILS.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: controllerField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          {field.name === "message" ? (
                            <Textarea
                              className="min-h-[140px] resize-none"
                              placeholder="What are you working on?"
                              {...controllerField}
                            />
                          ) : (
                            <Input
                              placeholder={`Enter your ${field.name}...`}
                              {...controllerField}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="submit" className="portfolio-submit-action w-full">
                  Send message
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Contact;
