import { z } from "zod";

const shortText = z.string().trim().min(1).max(2000);
export const quizSchema = z.object({
  title: shortText,
  passage: z.string().trim().min(30).max(5000),
  questions: z.array(z.object({
    section: z.enum(["reading", "grammar"]),
    prompt: shortText,
    options: z.array(z.string().trim().min(1).max(500)).length(4)
      .refine((items) => new Set(items.map((item) => item.toLowerCase())).size === 4, "Pilihan harus berbeda."),
    answer: z.number().int().min(0).max(3),
    explanation: shortText,
  })).length(6),
  writingPrompt: shortText,
}).refine((quiz) => quiz.questions.filter((q) => q.section === "reading").length === 3, "Harus 3 reading dan 3 grammar.");

export const writingFeedbackSchema = z.object({
  content: z.number().int().min(0).max(5),
  grammar: z.number().int().min(0).max(5),
  vocabulary: z.number().int().min(0).max(5),
  organization: z.number().int().min(0).max(5),
  feedback: shortText,
  improvedAnswer: shortText,
  nextSteps: z.array(shortText).min(1).max(3),
});

export const submissionSchema = z.object({
  attemptId: z.uuid(),
  answers: z.array(z.number().int().min(0).max(3)).length(6),
  writing: z.string().trim().min(1, "Tulis jawaban terlebih dahulu.").max(4000),
});

export type Quiz = z.infer<typeof quizSchema>;
export type WritingFeedback = z.infer<typeof writingFeedbackSchema>;
export type TestResult = {
  score: number;
  readingScore: number;
  grammarScore: number;
  writingScore: number;
  feedback: WritingFeedback;
  questions: Array<Quiz["questions"][number] & { selected: number; correct: boolean }>;
};
export type PublicAttempt = {
  id: string;
  dayNumber: number;
  createdAt: string;
  quiz: {
    title: string;
    passage: string;
    writingPrompt: string;
    questions: Array<Pick<Quiz["questions"][number], "section" | "prompt" | "options">>;
  };
  answers: number[] | null;
  writing: string | null;
  result: TestResult | null;
};

export function publicQuiz(quiz: Quiz): PublicAttempt["quiz"] {
  return {
    title: quiz.title, passage: quiz.passage, writingPrompt: quiz.writingPrompt,
    questions: quiz.questions.map(({ section, prompt, options }) => ({ section, prompt, options })),
  };
}

export function gradeQuiz(quiz: Quiz, answers: number[], feedback: WritingFeedback): TestResult {
  const questions = quiz.questions.map((q, i) => ({ ...q, selected: answers[i], correct: answers[i] === q.answer }));
  const readingScore = questions.filter((q) => q.section === "reading" && q.correct).length * 10;
  const grammarScore = questions.filter((q) => q.section === "grammar" && q.correct).length * 10;
  const writingScore = (feedback.content + feedback.grammar + feedback.vocabulary + feedback.organization) * 2;
  return { score: readingScore + grammarScore + writingScore, readingScore, grammarScore, writingScore, questions, feedback };
}
