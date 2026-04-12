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

export const MOCK_EXAM_CUTOFFS: Record<string, Array<{ min: number; label: string }>> = {
  UPCAT: [
    { min: 90, label: "Competitive for UP Diliman priority programs" },
    { min: 80, label: "Competitive for most UP campuses" },
    { min: 70, label: "Within range — more practice recommended" },
    { min: 0,  label: "Keep going — aim for 75%+" },
  ],
  ACET: [
    { min: 85, label: "Strong standing for Ateneo" },
    { min: 70, label: "Competitive range" },
    { min: 0,  label: "Keep practicing" },
  ],
  USTET: [
    { min: 80, label: "Strong for UST" },
    { min: 65, label: "Competitive range" },
    { min: 0,  label: "Keep practicing" },
  ],
  DLSUCET: [
    { min: 80, label: "Strong for DLSU" },
    { min: 65, label: "Competitive range" },
    { min: 0,  label: "Keep practicing" },
  ],
  PUPCET: [
    { min: 80, label: "Strong for PUP" },
    { min: 65, label: "Competitive range" },
    { min: 0,  label: "Keep practicing" },
  ],
};

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
