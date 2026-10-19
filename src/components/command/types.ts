import type { ComponentType } from "react";

export type CommandCategory =
  | "Navigation"
  | "Records"
  | "Actions"
  | "Preferences"
  | "Projects"
  | "Tech Filters";

/** One runnable entry in a command surface registry. */
export type CommandItem = {
  id: string;
  category: CommandCategory;
  title: string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  keywords?: string[];
  run: () => void;
};

/** One local capture action on the QuickSheet Add tab. */
export type CaptureItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  run: () => void;
  /** Confirmation shown while the sheet stays open after a local capture. */
  confirm?: string;
};
