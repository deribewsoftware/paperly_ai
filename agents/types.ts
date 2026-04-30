export type DocumentTone = "professional" | "academic" | "startup";

export type DocumentRequest = {
  prompt: string;
  tone: DocumentTone;
};

export type GeneratedSection = {
  title: string;
  body: string;
};
