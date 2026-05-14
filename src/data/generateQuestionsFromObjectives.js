const TARGET_PER_EXAM = 20;

const LEVEL_BY_EXAM = {
  "AZ-900": "1",
  "AZ-104": "2",
  "AZ-305": "3",
};

const DISTRACTORS = [
  "A single global admin account with broad access",
  "Manual portal-only operations without policy control",
  "A fixed-size architecture with no scaling strategy",
  "Disabling monitoring to reduce operational overhead",
  "Public endpoints for all services by default",
  "One-time deployment with no lifecycle governance",
  "Centralized credentials hardcoded in application code",
  "No backup or disaster recovery validation process",
];

function normalizeDomain(objective, fallback) {
  const cleaned = objective.replace(/^[\-\s]+/, "").trim();
  const fromColon = cleaned.split(":")[0]?.trim();
  const short = fromColon && fromColon.length <= 40 ? fromColon : "Official Objective";
  return short || fallback || "Official Objective";
}

function rotateOptions(correct, seed) {
  const options = [correct];
  for (let i = 0; options.length < 4; i += 1) {
    const pick = DISTRACTORS[(seed + i) % DISTRACTORS.length];
    if (!options.includes(pick) && pick !== correct) options.push(pick);
  }

  const answer = seed % 4;
  const rotated = [];
  for (let i = 0; i < 4; i += 1) {
    rotated.push(options[(i - answer + 4) % 4]);
  }

  return { options: rotated, answer };
}

function createQuestion(examCode, objective, idx) {
  const objectiveLabel = objective.trim();
  const domain = normalizeDomain(objectiveLabel, examCode);
  const stems = [
    `Which approach best aligns with this official objective for ${examCode}: ${objectiveLabel}?`,
    `You are designing a study scenario for ${examCode}. Which choice best demonstrates: ${objectiveLabel}?`,
    `For ${examCode}, which implementation decision most directly satisfies this objective: ${objectiveLabel}?`,
    `A practice item targets this objective in ${examCode}: ${objectiveLabel}. Which answer is strongest?`,
    `Which solution pattern best supports this ${examCode} objective: ${objectiveLabel}?`,
  ];

  const correct = `Implement a governed Azure design that explicitly addresses: ${objectiveLabel}`;
  const { options, answer } = rotateOptions(correct, idx);

  return {
    domain,
    question: stems[idx % stems.length],
    options,
    answer,
    explanation: `This practice question is derived from the official Microsoft Learn objective text. The correct answer is the only option that directly and explicitly fulfills '${objectiveLabel}'.`,
    source: "microsoft-learn-objective",
    examCode,
    objectiveText: objectiveLabel,
    objectiveIndex: idx,
  };
}

function buildQuestionsForExam(examRecord) {
  const objectives = (examRecord.skills || []).filter(Boolean);
  const fallback = examRecord.subtitle ? [examRecord.subtitle] : [examRecord.title || examRecord.examCode];
  const pool = objectives.length > 0 ? objectives : fallback;

  const questions = [];
  for (let i = 0; i < TARGET_PER_EXAM; i += 1) {
    const objective = pool[i % pool.length];
    questions.push(createQuestion(examRecord.examCode, objective, i));
  }

  return questions;
}

export function generateQuestionBank(officialExams) {
  const out = { 1: [], 2: [], 3: [] };

  for (const exam of officialExams) {
    const level = LEVEL_BY_EXAM[exam.examCode];
    if (!level) continue;
    out[level] = buildQuestionsForExam(exam);
  }

  return out;
}
