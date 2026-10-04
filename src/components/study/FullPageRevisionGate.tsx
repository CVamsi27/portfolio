"use client";
import RevisionDeckModal from "./RevisionDeckModal";
export default function FullPageRevisionGate(
  props: React.ComponentProps<typeof RevisionDeckModal>,
) {
  return <RevisionDeckModal {...props} />;
}
