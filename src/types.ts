export interface Flashcard {
  id: string;
  domainId: string;
  question: string;
  answer: string;
}

export interface TrickQuestionOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

export interface TrickQuestion {
  id: string;
  domainId: string;
  domainName: string;
  scenario: string;
  options: TrickQuestionOption[];
  correctAnswer: "A" | "B" | "C" | "D";
  trickAlert: string;
  correctExplanation: string;
  distractorExplanations: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export interface KeyFramework {
  title: string;
  content: string;
  bullets?: string[];
}

export interface DomainData {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  overviewSummary: string;
  keyFrameworks: KeyFramework[];
  keyServices: string[];
}

export interface DistractorItem {
  id: string;
  title: string;
  category: string;
  serviceA: string;
  serviceB: string;
  serviceAUsage: string;
  serviceBUsage: string;
  keyTrap: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  iconName: string;
  unlocked: boolean;
  progress: number;
  valueText: string;
  category: "study" | "mastery" | "quiz" | "chat";
}

