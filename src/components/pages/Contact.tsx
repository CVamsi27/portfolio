"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, Copy, Send, Loader2, Download } from "lucide-react";

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
import { CONTACT_EMAIL } from "@/lib/const";

const FormSchema = z.object({
  name: z.string().trim().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Provide a valid email address.",
  }),
  message: z.string().trim().min(5, {
    message: "Please include a brief message.",
  }),
});

const QUICK_TOPICS = [
  {
    label: "Full Stack Role",
    text: "Hi Vamsi, I'd like to discuss a remote full-stack role with our team...",
  },
  {
    label: "Healthcare / Docita",
    text: "Hi Vamsi, I was impressed by Docita and would love to learn more about your healthcare architecture...",
  },
  {
    label: "Contract Engagement",
    text: "Hi Vamsi, we're looking for a full-stack engineer for a defined remote project...",
  },
  {
    label: "General Inquiry",
    text: "Hi Vamsi, I came across your portfolio and wanted to connect...",
  },
];

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      "TITLE:Senior Full Stack Engineer",
      `EMAIL;TYPE=INTERNET,PREF:${CONTACT_EMAIL}`,
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
    setSubmitError(null);
    try {
      const response = await fetch(`/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await response.json();

      if (response.ok && (res?.success || res?.status === 200)) {
        toast({
          title: "Message sent successfully!",
          description:
            "Thanks for reaching out — I will get back to you shortly.",
        });
        setSubmitted(true);
        form.reset();
      } else {
        setSubmitError(
          "Your message could not be sent. Try again or email me directly.",
        );
        toast({
          title: "Message transmission failed",
          description: `Please email me directly at ${CONTACT_EMAIL}`,
        });
      }
    } catch {
      setSubmitError(
        "Your message could not be sent. Try again or email me directly.",
      );
      toast({
        title: "Could not send message",
        description: `Please email directly at ${CONTACT_EMAIL}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="Contact"
      className="portfolio-section portfolio-contact-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="07 // Direct Dispatch"
          title="Let’s build something durable."
          description="If you are hiring for a remote full-stack role, modernizing operational workflows, or need an engineer fluent from UI to PostgreSQL internals, reach out directly."
        />

        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* Left Column: Clean Editorial Coordinates (Zero glowing dots) */}
          <Reveal direction="left" className="space-y-8">
            <div className="border-t border-[var(--portfolio-rule)] pt-6">
              <p className="portfolio-meta-label">Primary Inbox</p>

              <div className="mt-4 flex flex-col gap-4">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="portfolio-contact-email break-all sm:break-normal"
                >
                  <span>{CONTACT_EMAIL}</span>
                </a>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="portfolio-copy-action"
                    title="Copy email to clipboard"
                    aria-label={`Copy ${CONTACT_EMAIL}`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy email</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className="portfolio-copy-action"
                    title="Download vCard contact (.vcf)"
                    aria-label="Download vCard contact"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download vCard</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--portfolio-rule)] pt-6">
              <p className="portfolio-meta-label">Location &amp; Overlap</p>
              <p className="mt-3 font-sans text-sm font-medium text-[var(--portfolio-ink)]">
                Hyderabad, India · Remote full-stack roles
              </p>
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-[var(--portfolio-muted)]">
                India and global remote; EU/Germany remote with relocation where
                required. Working-hour overlap by agreement.
              </p>
            </div>

            <div className="border-t border-[var(--portfolio-rule)] pt-6">
              <p className="portfolio-meta-label mb-3">External Channels</p>
              <Connections />
            </div>
          </Reveal>

          {/* Right Column: Serene Architectural Message Form */}
          <Reveal direction="right" className="portfolio-contact-form">
            <div className="mb-6 border-b border-[var(--portfolio-rule)] pb-4">
              <p className="portfolio-meta-label">Direct Message</p>
              <h3 className="mt-2 font-display text-3xl font-light tracking-[-0.025em] text-[var(--portfolio-ink)]">
                Send a message
              </h3>
              <p className="mt-1 font-sans text-xs text-[var(--portfolio-muted)]">
                Pick a topic template or write a direct note below.
              </p>
            </div>

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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="name"
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
                      <FormLabel>Your email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
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
                        <span className="font-mono text-[10px] text-[var(--portfolio-muted)]">
                          {field.value.length} chars
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          className="min-h-[130px] resize-none"
                          placeholder="Tell me about your product, role, or engineering challenge..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submitError ? (
                  <p
                    role="alert"
                    className="border border-[var(--portfolio-accent)] bg-[var(--portfolio-blue-soft)] p-3 font-sans text-xs text-[var(--portfolio-ink)]"
                  >
                    {submitError}{" "}
                    <a
                      className="underline hover:text-[var(--portfolio-accent)]"
                      href={`mailto:${CONTACT_EMAIL}`}
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                ) : null}

                {submitted ? (
                  <div
                    role="status"
                    className="border border-[var(--portfolio-rule)] bg-[var(--portfolio-wash)] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--portfolio-ink)] bg-[var(--portfolio-ink)] text-[var(--portfolio-paper)]">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-display text-xl font-light text-[var(--portfolio-ink)]">
                          Message received
                        </p>
                        <p className="font-sans text-xs text-[var(--portfolio-muted)]">
                          Replies typically within 24–48 hours.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setActiveTopic(null);
                        form.reset();
                      }}
                      className="portfolio-secondary-action mt-4 w-full cursor-pointer"
                    >
                      Send another message
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
                        <Send className="h-3.5 w-3.5" />
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
