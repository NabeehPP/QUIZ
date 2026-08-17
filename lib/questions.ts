import "server-only";

export interface FullQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export const TIME_LIMIT_SECONDS = 25;

// 15-question competitive group quiz
//
// Difficulty:
// Easy   : Q1 - Q4
// Medium : Q5 - Q11
// Hard   : Q12 - Q15
//
// The quiz contains mainly Anti-Ragging awareness questions,
// with a small amount of General Knowledge for variety.

export const QUESTIONS: FullQuestion[] = [
  // ============================================================
  // EASY
  // ============================================================

  {
    question:
      "National Anti-Ragging Day in India is observed on:",
    options: [
      "August 8",
      "August 12",
      "August 15",
      "August 18",
    ],
    correctIndex: 1,
    explanation:
      "National Anti-Ragging Day is observed on August 12. The National Anti-Ragging Week follows from August 12 to August 18.",
  },

  {
    question:
      "Which organisation has framed the UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions?",
    options: [
      "University Grants Commission",
      "National Testing Agency",
      "National Council of Educational Research and Training",
      "All India Council for Technical Education",
    ],
    correctIndex: 0,
    explanation:
      "The University Grants Commission, commonly known as UGC, framed the regulations for curbing ragging in higher educational institutions.",
  },

  {
    question:
      "Which of the following can be considered ragging?",
    options: [
      "Humiliating a fresher",
      "Intimidating a junior student",
      "Forcing a student to perform an unwanted act",
      "All of these",
    ],
    correctIndex: 3,
    explanation:
      "Ragging can include conduct that humiliates, intimidates, causes psychological harm, or forces a fresher or junior student to perform an unwanted act.",
  },

  {
    question:
      "Which is the official National Anti-Ragging Helpline number in India?",
    options: [
      "1800-180-5522",
      "1800-111-657",
      "1800-425-3800",
      "1800-200-3000",
    ],
    correctIndex: 0,
    explanation:
      "The official National Anti-Ragging Helpline is 1800-180-5522. The UGC and National Anti-Ragging Monitoring Agency publish this number for reporting and assistance.",
  },

  // ============================================================
  // MEDIUM
  // ============================================================

  {
   question:
  "Which of the following is the official National Anti-Ragging website?",
options: [
  "www.ugcantiragging.gov.in",
  "www.nationalantiragging.gov.in",
  "www.antiraggingindia.gov.in",
  "www.antiragging.in",
],
correctIndex: 3,
explanation:
  "The official National Anti-Ragging portal is antiragging.in, which provides information, complaint facilities, helpline details, and anti-ragging resources.",
  },

  {
    question:
      "The UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions were issued in which year?",
    options: [
      "2005",
      "2007",
      "2009",
      "2012",
    ],
    correctIndex: 2,
    explanation:
      "The UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions were issued in 2009.",
  },

  {
    question:
      "Who headed the committee whose recommendations played an important role in India's anti-ragging framework?",
    options: [
      "R. K. Raghavan",
      "Sanjay Dhande",
      "K. Radhakrishnan",
      "U. R. Rao",
    ],
    correctIndex: 0,
    explanation:
      "The committee headed by R. K. Raghavan examined the problem of ragging and made recommendations that contributed significantly to India's anti-ragging framework.",
  },

  {
    question:
      "Anti-ragging undertakings are generally submitted by:",
    options: [
      "Students alone",
      "Parents or guardians alone",
      "Students along with their parents or guardians",
      "Faculty members alone",
    ],
    correctIndex: 2,
    explanation:
      "The anti-ragging system requires undertakings from students along with their parents or guardians as part of the prevention and compliance process.",
  },

  {
    question:
      "A senior asks a fresher to introduce themselves. The fresher willingly agrees, there is no humiliation or pressure, and the interaction remains respectful. Which is the most accurate statement?",
    options: [
      "It is automatically ragging because the student is a fresher",
      "It is automatically ragging because a senior gave the instruction",
      "It is not necessarily ragging in these circumstances",
      "It becomes ragging whenever another student is watching",
    ],
    correctIndex: 2,
    explanation:
      "A respectful and voluntary interaction is not automatically ragging. The nature of the conduct, including coercion, humiliation, intimidation, or psychological harm, matters.",
  },

  {
    question:
      "Which statement best reflects the principle of zero tolerance toward ragging?",
    options: [
      "Only serious physical violence should be reported",
      "Minor incidents may be ignored if nobody complains",
      "Ragging should not be accepted or overlooked, whether major or minor",
      "Only incidents involving first-year students require action",
    ],
    correctIndex: 2,
    explanation:
      "The anti-ragging framework follows a zero-tolerance approach. Acts of ragging should not be ignored simply because they appear minor or do not involve physical violence.",
  },

  {
    question:
  "Who is the UGC National Anti Ragging Monitoring Agency?",
options: [
  "Centre for Youth (C4Y)",
  "National Council for Youth Affairs (NCYA)",
  "National Youth Development Council (NYDC)",
  "Centre for Educational Monitoring (CEM)",
],
correctIndex: 0,
explanation:
  "The Centre for Youth (C4Y) is the UGC National Anti Ragging Monitoring Agency responsible for monitoring the National Anti Ragging Helpline and related anti-ragging activities.",
  },

  // ============================================================
  // HARD
  // ============================================================

  {
    question:
      "Four seniors plan a humiliating activity for freshers. One senior creates the plan and arranges the location but leaves before the activity begins. Which interpretation is most accurate?",
    options: [
      "No action is possible because the senior was absent",
      "Only students physically present can face action",
      "The senior may face action for assisting or abetting the activity",
      "Action is possible only if physical injury occurs",
    ],
    correctIndex: 2,
    explanation:
      "The anti-ragging framework does not focus only on direct physical participation. Assisting, abetting, or participating in a plan to promote ragging can also attract action.",
  },

  {
    question:
      "A group of seniors tells a fresher to perform an embarrassing act. The fresher refuses, but the seniors threaten that refusing will cause problems for the student's academic life. Which factor most strongly changes the situation?",
    options: [
      "The activity was organised outside class hours",
      "The students were senior to the fresher",
      "The activity lasted less than five minutes",
      "The fresher was subjected to intimidation and pressure",
    ],
    correctIndex: 3,
    explanation:
      "Intimidation and pressure are central concerns. Ragging is not limited to physical violence and can include conduct that creates fear, apprehension, humiliation, or psychological harm.",
  },

  {
    question:
      "Which Supreme Court case is specifically referred to in the preamble of the UGC Anti-Ragging Regulations, 2009?",
    options: [
      "Vishaka v. State of Rajasthan",
      "University of Kerala v. Council, Principals, Colleges and Others",
      "Maneka Gandhi v. Union of India",
      "T. M. A. Pai Foundation v. State of Karnataka",
    ],
    correctIndex: 1,
    explanation:
      "The preamble of the UGC Anti-Ragging Regulations, 2009 refers to the Supreme Court matter involving the University of Kerala, its Council, Principals, Colleges and others.",
  },

  {
    question:
      "A college receives a credible complaint that students were being forced to perform humiliating acts. No student suffered a physical injury. Which conclusion is most appropriate?",
    options: [
      "No ragging can be established without physical injury",
      "The complaint can still concern ragging because physical injury is not essential",
      "Only the students who were physically injured can complain",
      "The matter is automatically treated as ordinary student misconduct",
    ],
    correctIndex: 1,
    explanation:
      "Physical injury is not a necessary condition for ragging. Humiliation, intimidation, psychological harm, or forcing a student to perform unwanted acts can fall within the anti-ragging framework.",
  },

];

if (QUESTIONS.length !== 15) {
  // eslint-disable-next-line no-console
  console.warn(
    `Expected exactly 15 questions, found ${QUESTIONS.length}.`
  );
}