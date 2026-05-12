export const EXAM_TAGS = [
  "UPCAT",
  "ACET",
  "USTET",
  "DLSUCET",
  "PUPCET",
  "DOST-SEI",
  "JLSS",
] as const;

export type ExamTag = (typeof EXAM_TAGS)[number];

export const SUBJECTS = [
  "English",
  "Mathematics",
  "Science",
  "Abstract Reasoning",
  "Filipino",
  "Mechanical-Technical",
  "General Information",
] as const;

export type Subject = (typeof SUBJECTS)[number];
