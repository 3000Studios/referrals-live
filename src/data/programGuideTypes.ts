/** Original program guide written from the company's own pages. */
export type ProgramGuide = {
  company: string;
  programType: string;
  summary: string;
  whoItsFor: string;
  howItPays: string[];
  eligibility: string[];
  steps: string[];
  tips: string[];
  watchOuts: string[];
  faq: Array<{ q: string; a: string }>;
  publicPosting: "allowed" | "restricted" | "unclear";
  publicPostingNote: string;
  sources: Array<{ title: string; url: string; checked: string }>;
  confidence: "high" | "medium" | "low";
};
