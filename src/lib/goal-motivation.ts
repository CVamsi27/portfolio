import type { GoalCategory } from "./user-prefs";

/** Original encouragement; no borrowed quotes or promises of an outcome. */
export function goalEncouragement(category: GoalCategory, country?: string) {
  const destination =
    country && country !== "Other" ? country : "your next home";
  const messages: Record<GoalCategory, { why: string; reminders: string[] }> = {
    relocation: {
      why: `You’re building a life in ${destination}, one useful step at a time. The preparation you do today gives that next chapter a stronger foundation.`,
      reminders: [
        `Every skill you strengthen, application you send, and conversation you start is preparation for your life in ${destination}.`,
        "You do not need to solve the whole journey today. Give the next step your attention.",
        "A difficult day does not cancel your progress. Come back to the work that opens your next door.",
      ],
    },
    career: {
      why: "You’re building a career that reflects what you can do. Each project, thoughtful application, and honest conversation helps make your work visible.",
      reminders: [
        "Build something you can explain with confidence. Let your work tell the story.",
        "One rejection is one response, not a verdict on your ability. Keep improving and keep reaching out.",
        "The engineer you want to become is shaped by the problems you choose to work through today.",
      ],
    },
    learning: {
      why: "You’re making difficult ideas your own. Understanding grows through practice, questions, and returning to what still feels unclear.",
      reminders: [
        "Understanding one idea deeply is progress worth making today.",
        "You do not have to know it yet. You only have to stay curious enough to work through it.",
        "Try it, explain it, and revisit it. That is how unfamiliar ideas become skills you can use.",
      ],
    },
    fitness: {
      why: "You’re building strength for the life you want to live. Sustainable training and recovery both move you toward that goal.",
      reminders: [
        "Show up at a pace you can return to. Consistency grows from a routine that supports you.",
        "Rest is part of becoming stronger. Choose the next step your body can sustain.",
        "Your progress belongs to you. Keep your attention on your own next session.",
      ],
    },
    weightloss: {
      why: "You’re working toward feeling healthier and more at home in your body. Small, sustainable choices matter more than a perfect day.",
      reminders: [
        "Care for yourself today in a way you can repeat tomorrow.",
        "One number cannot capture your effort. Notice the habits you are building.",
        "A setback is a moment to adjust, not a reason to punish yourself.",
      ],
    },
    financial: {
      why: "You’re creating more room to choose your future. Each thoughtful financial decision supports the stability you are working toward.",
      reminders: [
        "Choose one decision today that supports the future you want.",
        "Steady, considered progress is worth more than pressure to move quickly.",
        "Make the next useful choice with the information you have. Review and adjust as you learn.",
      ],
    },
    general: {
      why: "This goal matters because you chose it. You can build momentum with one deliberate step, even when the whole path is not clear yet.",
      reminders: [
        "Give one meaningful thing your attention today.",
        "You can start small and still take your goal seriously.",
        "Progress does not require a perfect day. It starts with returning to what matters.",
      ],
    },
    custom: {
      why: "You chose this goal for a reason. Keep that reason close, and turn it into one achievable step today.",
      reminders: [
        "Your next step does not have to be impressive. It has to move you toward what matters.",
        "Make space for the thing you said you wanted. A little focused effort is a beginning.",
        "Keep going at a pace you can sustain. You are allowed to learn and adjust along the way.",
      ],
    },
  };
  return messages[category];
}
