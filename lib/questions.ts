import "server-only";

export interface FullQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export const TIME_LIMIT_SECONDS = 15;

// This file lives on the server only and is never bundled to the client.
// Feel free to edit these before the event — keep exactly 15 questions,
// each with exactly 4 options.
export const QUESTIONS: FullQuestion[] = [
  {
    question: "What officially counts as \"ragging\" under UGC regulations?",
    options: [
      "Only physical violence against a junior",
      "Any act that causes physical, psychological or mental harm to a fresher, including teasing, humiliation or forced compliance",
      "Only online bullying between students",
      "Only actions reported by faculty",
    ],
    correctIndex: 1,
    explanation:
      "UGC regulations define ragging broadly — it includes verbal abuse, humiliation, forced tasks, and psychological harm, not just physical violence.",
  },
  {
    question: "A senior asks a fresher to sing/dance publicly \"or else.\" This is:",
    options: [
      "A harmless college tradition",
      "Ragging — forced performance under threat is a punishable act",
      "Allowed if seniors say it's \"for fun\"",
      "Only a problem if it's filmed",
    ],
    correctIndex: 1,
    explanation:
      "Forcing anyone to perform under threat or pressure is ragging, regardless of intent — traditions don't excuse coercion.",
  },
  {
    question: "What should you do first if you witness ragging?",
    options: [
      "Ignore it — it's not your problem",
      "Film it for social media",
      "Safely intervene if possible, then report it to the Anti-Ragging Committee or helpline",
      "Wait to see if it happens again",
    ],
    correctIndex: 2,
    explanation:
      "Bystanders play a key role — safely stepping in or promptly reporting can stop harm before it escalates.",
  },
  {
    question: "India's national anti-ragging helpline is:",
    options: [
      "A UGC toll-free helpline (1800-180-5522) monitored 24x7",
      "Only your class WhatsApp group",
      "There is no national helpline",
      "Only available to final-year students",
    ],
    correctIndex: 0,
    explanation:
      "The UGC runs a 24x7 toll-free anti-ragging helpline that any student can call anonymously.",
  },
  {
    question: "Can a victim of ragging file a complaint anonymously?",
    options: [
      "No, full identity must always be revealed",
      "Yes — anonymous and confidential complaints are accepted and protected",
      "Only parents can file complaints",
      "Only after graduating",
    ],
    correctIndex: 1,
    explanation:
      "Institutions are required to accept anonymous complaints and protect the identity of whistleblowers.",
  },
  {
    question: "Which of these is an example of psychological ragging?",
    options: [
      "Helping a junior find their classroom",
      "Repeatedly mocking or isolating a junior to make them feel unwelcome",
      "Introducing yourself to a new student",
      "Inviting juniors to a club fair",
    ],
    correctIndex: 1,
    explanation:
      "Ragging isn't only physical — humiliation, mockery, and deliberate isolation cause real psychological harm.",
  },
  {
    question: "Under Indian law, ragging can lead to punishment that includes:",
    options: [
      "A verbal warning only, always",
      "Nothing — it's a civil matter only",
      "Suspension, expulsion, and even criminal prosecution depending on severity",
      "A fine payable to the senior's club",
    ],
    correctIndex: 2,
    explanation:
      "Ragging is a punishable offence — consequences range from suspension/expulsion to criminal charges in serious cases.",
  },
  {
    question: "What is the safest first step for a new student facing ragging?",
    options: [
      "Stay silent to avoid \"trouble\"",
      "Tell a trusted senior, warden, mentor, or use the anti-ragging helpline immediately",
      "Handle it alone by retaliating",
      "Leave the college immediately",
    ],
    correctIndex: 1,
    explanation:
      "Speaking up early to a trusted adult or official channel is the safest and most effective response.",
  },
  {
    question: "\"It happened to us, so it's fine to do it to juniors.\" This mindset is:",
    options: [
      "A fair tradition worth continuing",
      "A harmful cycle — past harm never justifies repeating it",
      "Only wrong if seniors get caught",
      "Acceptable if juniors don't complain",
    ],
    correctIndex: 1,
    explanation:
      "Passing on harm doesn't make it fair — breaking the cycle is what builds a safe, respectful campus culture.",
  },
  {
    question: "Every college in India is required to have:",
    options: [
      "An Anti-Ragging Committee and Anti-Ragging Squad",
      "No formal anti-ragging structure — it's optional",
      "Only a suggestion box",
      "A ragging awareness poster, and nothing else",
    ],
    correctIndex: 0,
    explanation:
      "UGC mandates every institution to set up an Anti-Ragging Committee (policy/oversight) and Squad (active monitoring).",
  },
  {
    question: "A group repeatedly sends embarrassing memes about a junior in a class group chat. This is:",
    options: [
      "Not ragging since it's online, not in person",
      "Cyber-ragging — online harassment is still ragging",
      "Fine as long as it's \"just jokes\"",
      "Only ragging if the junior responds angrily",
    ],
    correctIndex: 1,
    explanation:
      "Ragging isn't limited to physical spaces — online humiliation and harassment are equally serious and punishable.",
  },
  {
    question: "What's the healthiest way seniors can welcome juniors?",
    options: [
      "Testing their \"loyalty\" with tasks",
      "Ignoring them completely",
      "Genuine mentorship — guidance, friendship, and helping them settle in",
      "Comparing them unfavorably to their own batch",
    ],
    correctIndex: 2,
    explanation:
      "Real seniority is shown through mentorship and support, not power games — it builds trust instead of fear.",
  },
  {
    question: "If a fresher refuses a senior's \"instruction\" and faces threats for it, the fresher should:",
    options: [
      "Comply to avoid \"problems\"",
      "Document what happened and report it — refusing is their right",
      "Apologize to the senior",
      "Switch colleges",
    ],
    correctIndex: 1,
    explanation:
      "No student is obligated to comply with any senior's demands — documenting and reporting threats protects the fresher and others.",
  },
  {
    question: "Why do anti-ragging efforts matter for everyone, not just freshers?",
    options: [
      "They don't — only freshers are ever affected",
      "A safe, respectful campus benefits the whole community and its reputation",
      "They matter only during orientation week",
      "They're only relevant to hostel students",
    ],
    correctIndex: 1,
    explanation:
      "A culture free of ragging improves mental health, retention, and trust for every student, senior and junior alike.",
  },
  {
    question: "The best one-line takeaway for today's session is:",
    options: [
      "Ragging is harmless fun if nobody gets physically hurt",
      "Know the signs. Speak up. Stand together.",
      "It's tradition, so it must continue",
      "Only report ragging if it happens to you personally",
    ],
    correctIndex: 1,
    explanation:
      "Awareness, speaking up, and collective responsibility are what actually keep a campus safe for everyone.",
  },
];

if (QUESTIONS.length !== 15) {
  // eslint-disable-next-line no-console
  console.warn(`Expected exactly 15 questions, found ${QUESTIONS.length}.`);
}
