"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowUpRight,
  Mail,
  Check,
  Copy,
  Clock,
  MapPin,
  Phone,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";

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
  message: z.string().min(5, {
    message: "Please include a brief message.",
  }),
});

const QUICK_TOPICS = [
  { label: "Senior Product Engineering Role", text: "Hi Vamsi, I'd like to discuss a senior product engineering role with our team..." },
  { label: "Healthcare / Docita Tech", text: "Hi Vamsi, I was impressed by Docita and would love to learn more about your healthcare architecture..." },
  { label: "High-Impact Contract", text: "Hi Vamsi, we're looking for a lead full-stack engineer for a key platform project..." },
  { label: "General Chat", text: "Hi Vamsi, I came across your portfolio and wanted to connect..." },
];

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("cvamsik99@gmail.com");
      setCopied(true);
      toast({
        title: "Email copied to clipboard",
        description: "cvamsik99@gmail.com is ready to paste.",
      });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast({
        title: "cvamsik99@gmail.com",
        description: "Click to email or copy manually.",
      });
    }
  };

  const handleTopicClick = (topicText: string) => {
    form.setValue("message", topicText, { shouldValidate: true });
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await response.json();

      if (res?.success || res?.status === 200 || response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "Thanks for reaching out — I will get back to you shortly.",
        });
        setSubmitted(true);
        form.reset();
      } else {
        toast({
          title: "Message transmission failed",
          description: "Please email me directly at cvamsik99@gmail.com",
        });
      }
    } catch (error) {
      toast({
        title: "Could not send message",
        description: "Please email directly at cvamsik99@gmail.com",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="Contact" className="portfolio-section portfolio-contact-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="04 / Start a Conversation"
          title="Let’s build something durable"
          description="If you are building an important product, modernizing clinical workflows, or need an engineer who can move fluidly between product design and production backend systems, I'd like to hear from you."
        />

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left Column: Direct coordinates */}
          <Reveal direction="left" className="space-y-5 sm:space-y-6">
            {/* Primary Email Card */}
            <div className="rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-5 sm:p-6 shadow-xs">
              <p className="portfolio-meta-label">Primary Inbox</p>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <a
                  href="mailto:cvamsik99@gmail.com"
                  className="portfolio-contact-email text-lg sm:text-2xl break-all sm:break-normal"
                >
                  <Mail className="h-5 w-5 text-[var(--portfolio-accent)] shrink-0" />
                  <span>cvamsik99@gmail.com</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="portfolio-copy-action w-full sm:w-auto"
                  title="Copy email to clipboard"
                  aria-label="Copy cvamsik99@gmail.com"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="mt-3 text-xs text-[var(--portfolio-muted)]">
                Direct inbox monitored daily. Expect a response within 24 hours.
              </p>
            </div>

            {/* Availability & Location Card */}
            <div className="rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] pb-3">
                <p className="portfolio-meta-label">Location & Availability</p>
                <span className="portfolio-impact-pill">Active</span>
              </div>

              <div className="mt-4 space-y-3 text-xs text-[var(--portfolio-muted)]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--portfolio-accent)] shrink-0" />
                  <span className="text-[var(--portfolio-ink)] font-medium">Hyderabad, India (IST / UTC+5:30)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--portfolio-accent)] shrink-0" />
                  <span>Comfortable with US Eastern/Pacific, European, and APAC working hour overlaps.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--portfolio-accent)] shrink-0" />
                  <a
                    href="tel:+917702148303"
                    className="text-[var(--portfolio-ink)] underline decoration-[var(--portfolio-rule)] underline-offset-4 hover:text-[var(--portfolio-accent)]"
                  >
                    +91 7702148303
                  </a>
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--portfolio-rule)] pt-4">
                <p className="portfolio-meta-label mb-2.5">Find Me Online</p>
                <Connections />
              </div>
            </div>
          </Reveal>

          {/* Right Column: Direct Message Form */}
          <Reveal direction="right" className="portfolio-contact-form">
            <div className="mb-5">
              <p className="portfolio-meta-label mb-1.5">Direct Dispatch</p>
              <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--portfolio-ink)]">
                Send a message
              </h3>
              <p className="mt-1 text-xs text-[var(--portfolio-muted)]">
                Select a quick topic or write a custom message below.
              </p>
            </div>

            {/* Quick Topic Pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic.label}
                  type="button"
                  onClick={() => handleTopicClick(topic.text)}
                  className="portfolio-topic-chip"
                >
                  {topic.label}
                </button>
              ))}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Alex Chen"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="alex@company.com"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[130px] resize-none"
                          placeholder="Tell me about your product, role, or problem..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="portfolio-submit-action w-full cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending message...</span>
                    </>
                  ) : submitted ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Sent! Send another?</span>
                    </>
                  ) : (
                    <>
                      <span>Send message</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
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

