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
      className="w-full flex flex-col gap-10 justify-center pt-20 mb-20"
    >
      <span className="mt-20 text-3xl md:text-5xl font-semibold text-center">
        Contact
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-8 my-2">
        <div className="flex flex-col gap-8 items-center">
          <div className="flex flex-col gap-6 mt-10">
            {PERSONAL_DETAILS.map((value, index) => (
              <div key={index} className="flex gap-4 items-center">
                <span className="text-primary hover:text-border w-10 h-10 bg-border hover:bg-primary rounded-full p-2 flex items-center justify-center">
                  <value.icon />
                </span>
                <span>{value.value}</span>
              </div>
            ))}
          </div>
          <Connections />
        </div>
        <Form {...form}>
          <form
            method="POST"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 m-4"
          >
            {FORM_DETAILS.map((value, index) => (
              <FormField
                key={index}
                control={form.control}
                name={value.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{value.label}</FormLabel>
                    <FormControl>
                      {value.name === "message" ? (
                        <Textarea
                          className="border-0 bg-card"
                          placeholder=""
                          {...field}
                        />
                      ) : (
                        <Input
                          className="border-0 bg-card"
                          placeholder=""
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="submit">SEND MESSAGE</Button>
          </form>
        </Form>
      </div>
    </section>
  );
};
export default Contact;
