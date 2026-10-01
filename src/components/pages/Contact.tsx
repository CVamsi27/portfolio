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
  Download,
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
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/const";

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
  const [activeTopic, setActiveTopic] = useState<string | null>(null);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast({
        title: "Email copied to clipboard",
        description: `${CONTACT_EMAIL} is ready to paste.`,
      });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast({
        title: CONTACT_EMAIL,
        description: "Click to email or copy manually.",
      });
    }
  };

  const handleDownloadVCard = () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:Vamsi Krishna Chandaluri",
      "N:Chandaluri;Vamsi Krishna;;;",
      "TITLE:Senior Full Stack & Systems Engineer",
      `EMAIL;TYPE=INTERNET,PREF:${CONTACT_EMAIL}`,
      `TEL;TYPE=CELL:${CONTACT_PHONE.replace(/\\s+/g, "")}`,
      "URL:https://buildora.work",
      "NOTE:Full Stack Engineer specializing in TypeScript, React, NestJS, and PostgreSQL.",
      "END:VCARD",
    ].join("\r\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Vamsi_Krishna_Chandaluri.vcf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "vCard downloaded",
      description: "Contact saved as Vamsi_Krishna_Chandaluri.vcf",
    });
  };

  const handleTopicClick = (topicLabel: string, topicText: string) => {
    form.setValue("message", topicText, { shouldValidate: true });
    setActiveTopic(topicLabel);
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
          description: `Please email me directly at ${CONTACT_EMAIL}`,
        });
      }
    } catch {
      toast({
        title: "Could not send message",
        description: `Please email directly at ${CONTACT_EMAIL}`,
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
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="portfolio-contact-email text-lg sm:text-2xl break-all sm:break-normal"
                >
                  <Mail className="h-5 w-5 text-[var(--portfolio-accent)] shrink-0" />
                  <span>{CONTACT_EMAIL}</span>
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="portfolio-copy-action flex-1 sm:flex-initial"
                    title="Copy email to clipboard"
                    aria-label={`Copy ${CONTACT_EMAIL}`}
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

                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className="portfolio-copy-action flex-1 sm:flex-initial"
                    title="Download vCard contact (.vcf)"
                    aria-label="Download vCard contact"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>vCard</span>
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-[var(--portfolio-muted)]">
                Direct inbox monitored daily. Expect a response within 24 hours.
              </p>
            </div>

            {/* Availability & Location Card */}
            <div className="rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] pb-3">
                <p className="portfolio-meta-label">Location &amp; Availability</p>
                <span className="inline-flex items-center gap-1.5 portfolio-impact-pill">
                  <span className="portfolio-status-dot" aria-hidden="true" />
                  Active
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs text-[var(--portfolio-muted)]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--portfolio-accent)] shrink-0" />
                  <span className="text-[var(--portfolio-ink)] font-medium">Open to Relocation (Germany / Remote)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--portfolio-accent)] shrink-0" />
                  <span>Comfortable with European, US Eastern/Pacific, and APAC working hour overlaps.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--portfolio-accent)] shrink-0" />
                  <a
                    href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                    aria-label={`Call ${CONTACT_PHONE}`}
                    className="text-[var(--portfolio-ink)] underline decoration-[var(--portfolio-rule)] underline-offset-4 hover:text-[var(--portfolio-accent)]"
                  >
                    {CONTACT_PHONE}
                  </a>
                </div>
              </div>

              {/* Response time metric */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)] px-3 py-2">
                <span className="font-utility text-[0.6rem] font-bold uppercase tracking-widest text-[var(--portfolio-muted)]">Avg. reply</span>
                <span className="ml-auto font-display text-sm font-bold text-[var(--portfolio-ink)]">&lt; 24 hrs</span>
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
                  onClick={() => handleTopicClick(topic.label, topic.text)}
                  className={
                    activeTopic === topic.label
                      ? "portfolio-topic-chip is-active"
                      : "portfolio-topic-chip"
                  }
                  aria-pressed={activeTopic === topic.label}
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
                      <div className="flex items-center justify-between">
                        <FormLabel>Message</FormLabel>
                        <span className={
                          field.value.length >= 100
                            ? "font-utility text-[0.6rem] font-semibold text-emerald-500"
                            : field.value.length >= 50
                              ? "font-utility text-[0.6rem] text-[var(--portfolio-accent)]"
                              : "font-utility text-[0.6rem] text-[var(--portfolio-muted)]"
                        }>
                          {field.value.length >= 100 ? "Good length" : `${field.value.length} chars`}
                        </span>
                      </div>
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

                {submitted ? (
                  <div className="portfolio-contact-success">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display text-base font-bold text-[var(--portfolio-ink)] leading-tight">
                          Message received!
                        </p>
                        <p className="mt-0.5 font-utility text-xs text-[var(--portfolio-muted)]">
                          I typically reply within 24–48 hours.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSubmitted(false); setActiveTopic(null); form.reset(); }}
                      className="mt-4 w-full rounded-lg border border-[var(--portfolio-rule)] bg-transparent py-2 font-utility text-xs font-semibold text-[var(--portfolio-muted)] transition-all hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
                    >
                      Send another message →
                    </button>
                  </div>
                ) : (
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
                    ) : (
                      <>
                        <span>Send message</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </form>
            </Form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Contact;

