export interface AITAScenario {
  id: number;
  question: string;
  ytaPercentage: number;
  ntaPercentage: number;
}

export const aitaScenarios: AITAScenario[] = [
  {
    id: 1,
    question: "AITA for not using my mom as my realtor?",
    ytaPercentage: 23,
    ntaPercentage: 77,
  },
  {
    id: 2,
    question: "AITA for refusing to attend my sister's wedding because she didn't invite my partner?",
    ytaPercentage: 15,
    ntaPercentage: 85,
  },
  {
    id: 3,
    question: "AITA for eating the last slice of cake that was in the office fridge?",
    ytaPercentage: 68,
    ntaPercentage: 32,
  },
  {
    id: 4,
    question: "AITA for telling my roommate their cooking smells bad?",
    ytaPercentage: 52,
    ntaPercentage: 48,
  },
  {
    id: 5,
    question: "AITA for not giving up my airplane seat to a family that wanted to sit together?",
    ytaPercentage: 12,
    ntaPercentage: 88,
  },
  {
    id: 6,
    question: "AITA for charging my friend for the concert ticket they bailed on last minute?",
    ytaPercentage: 8,
    ntaPercentage: 92,
  },
  {
    id: 7,
    question: "AITA for refusing to share my Netflix password with my extended family?",
    ytaPercentage: 19,
    ntaPercentage: 81,
  },
  {
    id: 8,
    question: "AITA for not letting my neighbor use my WiFi anymore?",
    ytaPercentage: 5,
    ntaPercentage: 95,
  },
  {
    id: 9,
    question: "AITA for telling my parents I won't visit them for the holidays this year?",
    ytaPercentage: 42,
    ntaPercentage: 58,
  },
  {
    id: 10,
    question: "AITA for asking my coworker to stop microwaving fish in the office?",
    ytaPercentage: 3,
    ntaPercentage: 97,
  },
];
