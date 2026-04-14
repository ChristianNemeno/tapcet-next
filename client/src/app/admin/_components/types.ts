export interface QuestionDraft {
  text: string;
  options: [string, string, string, string];
  answer: number;
}

export interface SectionDraft {
  title: string;
  timeLimitSeconds: string;
  questions: QuestionDraft[];
}

export const emptyQuestion = (): QuestionDraft => ({
  text: "",
  options: ["", "", "", ""],
  answer: 0,
});

export const emptySection = (): SectionDraft => ({
  title: "",
  timeLimitSeconds: "",
  questions: [emptyQuestion()],
});
