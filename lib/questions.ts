import "server-only";

export interface FullQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export const TIME_LIMIT_SECONDS = 30;

// This file lives on the server only and is never bundled to the client.
// Feel free to edit these before the event. Keep exactly 15 questions,
// each with exactly 4 options.
export const QUESTIONS: FullQuestion[] = [
  {
    question: "Anti Ragging Day in India is observed on:",
    options: [
      "August 10",
      "August 12",
      "August 15",
      "August 18",
    ],
    correctIndex: 1,
    explanation:
      "Anti Ragging Day is observed every year on August 12 to create awareness about preventing ragging in educational institutions.",
  },
  {
    question: "Which organisation issued the Regulations on Curbing the Menace of Ragging in Higher Educational Institutions?",
    options: [
      "AICTE",
      "UGC",
      "NTA",
      "NCERT",
    ],
    correctIndex: 1,
    explanation:
      "The University Grants Commission, or UGC, issued the regulations to prevent and address ragging in higher educational institutions.",
  },
  {
    question: "Which of the following can constitute ragging?",
    options: [
      "Physical harassment",
      "Psychological harassment",
      "Humiliation or intimidation",
      "All of the above",
    ],
    correctIndex: 3,
    explanation:
      "Ragging can involve physical, verbal, psychological or humiliating acts. Physical violence is not required for an act to be considered ragging.",
  },
  {
    question: "In which year did the UGC Regulations on Curbing the Menace of Ragging come into force?",
    options: [
      "2005",
      "2007",
      "2009",
      "2011",
    ],
    correctIndex: 2,
    explanation:
      "The UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions came into force in 2009.",
  },
  {
    question: "A senior politely asks a fresher to introduce themselves. The fresher willingly participates, with no threat, pressure or humiliation. Is this automatically ragging?",
    options: [
      "Yes, because a senior gave the instruction",
      "Yes, because the student is a fresher",
      "No, not necessarily",
      "Yes, if other students are watching",
    ],
    correctIndex: 2,
    explanation:
      "A normal and voluntary interaction between seniors and juniors is not automatically ragging. Coercion, humiliation or harassment can change the situation.",
  },
  {
    question: "Who headed the committee that examined the issue of ragging and recommended preventive measures?",
    options: [
      "R.K. Raghavan",
      "Sanjay Dhande",
      "K. Radhakrishnan",
      "U.R. Rao",
    ],
    correctIndex: 0,
    explanation:
      "The committee was headed by R.K. Raghavan and its recommendations played an important role in developing India's anti ragging framework.",
  },
  {
    question: "Anti Ragging Week is observed from:",
    options: [
      "August 1 to 7",
      "August 5 to 11",
      "August 12 to 18",
      "August 15 to 21",
    ],
    correctIndex: 2,
    explanation:
      "Anti Ragging Week is observed from August 12 to August 18 as part of the national anti ragging awareness campaign.",
  },
  {
    question: "Which statement about ragging is correct?",
    options: [
      "Physical violence must always occur",
      "Only first year students can be victims",
      "Psychological or verbal harassment can also constitute ragging",
      "Ragging is acceptable if the student initially agrees",
    ],
    correctIndex: 2,
    explanation:
      "Ragging is not limited to physical violence. Psychological pressure, humiliation, intimidation and verbal harassment can also constitute ragging.",
  },
  {
    question: "Anti ragging undertakings are generally required from:",
    options: [
      "Students only",
      "Parents or guardians only",
      "Students and their parents or guardians",
      "Faculty members and students",
    ],
    correctIndex: 2,
    explanation:
      "Anti ragging undertakings are submitted by students along with their parents or guardians as part of the prevention process.",
  },
  {
    question: "Seniors ask a fresher to sing in front of them. The fresher initially agrees but later asks to stop because they are uncomfortable. The seniors continue pressuring them. What is the key concern?",
    options: [
      "The activity was initially voluntary",
      "The student later objected but was still pressured to continue",
      "No physical force was used",
      "Seniors are allowed to conduct such activities",
    ],
    correctIndex: 1,
    explanation:
      "The important issue is that the student objected but continued to face pressure. Coercion and humiliation can make an activity ragging.",
  },
  {
    question: "Which Supreme Court case is specifically referred to in the preamble of the UGC Anti Ragging Regulations, 2009?",
    options: [
      "Vishaka v. State of Rajasthan",
      "University of Kerala v. Council, Principals, Colleges and Others",
      "T.M.A. Pai Foundation v. State of Karnataka",
      "Maneka Gandhi v. Union of India",
    ],
    correctIndex: 1,
    explanation:
      "The preamble of the UGC Anti Ragging Regulations, 2009 refers to the Supreme Court case involving the University of Kerala and others.",
  },
  {
    question: "Which of the following is NOT necessarily required for an act to constitute ragging?",
    options: [
      "Humiliation",
      "Intimidation",
      "Psychological harm",
      "Physical injury",
    ],
    correctIndex: 3,
    explanation:
      "Ragging does not require physical injury. Acts involving humiliation, intimidation, psychological harm or forced conduct can also fall under the definition.",
  },
  {
    question: "According to the UGC regulations, action can be taken against a student who:",
    options: [
      "Only physically participates in ragging",
      "Only organises a ragging activity",
      "Rags, abets ragging, or participates in a conspiracy to promote ragging",
      "Witnesses ragging but does not report it",
    ],
    correctIndex: 2,
    explanation:
      "The regulations provide for action against students who rag, abet ragging or participate in a conspiracy to promote ragging.",
  },
  {
    question: "Four seniors plan a humiliating activity for freshers. One senior creates the plan and arranges the location but leaves before the activity begins. What is the most accurate interpretation?",
    options: [
      "No action can be taken because the student was absent",
      "Only students who physically participated can be punished",
      "The student may face action for assisting or abetting ragging",
      "Action is possible only if someone suffers physical injury",
    ],
    correctIndex: 2,
    explanation:
      "Direct physical participation is not the only concern. Assisting, abetting or being involved in a plan to promote ragging can also lead to disciplinary action.",
  },
  {
    question: "Which of the following is a possible consequence of ragging under the UGC regulations?",
    options: [
      "Only a verbal warning",
      "Suspension or cancellation of admission",
      "Only a monetary fine",
      "No action unless physical injury occurs",
    ],
    correctIndex: 1,
    explanation:
      "Depending on the severity of the incident, penalties can include suspension, cancellation of admission, rustication or expulsion.",
  },
];

if (QUESTIONS.length !== 15) {
  // eslint-disable-next-line no-console
  console.warn(`Expected exactly 15 questions, found ${QUESTIONS.length}.`);
}
