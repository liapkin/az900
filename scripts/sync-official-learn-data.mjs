import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateQuestionBank } from "../src/data/generateQuestionsFromObjectives.js";

const TARGET_CODES = ["AZ-900", "AZ-104", "AZ-305"];
const CATALOG_URL = "https://learn.microsoft.com/api/catalog/?type=exams,certifications,mergedCertifications&locale=en-us";
const CERT_UID_BY_CODE = {
  "AZ-900": "certification.azure-fundamentals",
  "AZ-104": "certification.azure-administrator",
  "AZ-305": "certification.azure-solutions-architect",
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const officialPath = resolve(rootDir, "src/data/officialExams.json");
const questionPath = resolve(rootDir, "src/data/generatedQuestionBank.json");

function uniqueStrings(values) {
  return [...new Set(values.filter((v) => typeof v === "string" && v.trim()))];
}

function extractSkillStrings(record) {
  if (!record) return [];
  if (Array.isArray(record.skills)) {
    return record.skills
      .map((s) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object") return s.title || s.name || s.description || "";
        return "";
      })
      .filter(Boolean);
  }
  return [];
}

function recordReferencesExam(record, examUid) {
  if (!record || !examUid) return false;
  if (record.exam_uid === examUid) return true;
  if (record.examUid === examUid) return true;
  if (Array.isArray(record.exams) && record.exams.some((e) => e === examUid || e?.uid === examUid)) return true;
  return false;
}

function normalizeExam(exam, certCandidates) {
  const related = certCandidates.filter((c) => recordReferencesExam(c, exam.uid));
  const skills = uniqueStrings([
    ...extractSkillStrings(exam),
    ...related.flatMap((r) => extractSkillStrings(r)),
  ]);

  const studyGuide = uniqueStrings([
    ...(Array.isArray(exam.study_guide) ? exam.study_guide.map((s) => s?.url || s?.uid || s?.title || "") : []),
    ...related.flatMap((r) => (Array.isArray(r.study_guide) ? r.study_guide.map((s) => s?.url || s?.uid || s?.title || "") : [])),
  ]);

  const certNames = uniqueStrings(related.map((r) => r.title || r.display_name || r.uid || ""));

  return {
    examCode: exam.display_name,
    examUid: exam.uid,
    title: exam.title,
    subtitle: exam.subtitle || "",
    url: exam.url,
    lastModified: exam.last_modified || null,
    pdfUrl: exam.pdf_download_url || null,
    practiceAssessmentUrl: exam.practice_assessment_url || null,
    studyGuide,
    relatedCertifications: certNames,
    skills,
  };
}

function deriveExamUidFromProviders(record) {
  const providers = Array.isArray(record?.providers) ? record.providers : [];
  for (const provider of providers) {
    const examUrl = provider?.examUrl;
    if (typeof examUrl !== "string") continue;
    const match = examUrl.match(/examUid=([^&]+)/i);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

function normalizeFromCertification(code, certRecord, fallbackExam) {
  const examUid = fallbackExam?.uid || deriveExamUidFromProviders(certRecord) || `exam.${code.toLowerCase()}`;
  const skills = uniqueStrings(extractSkillStrings(certRecord));
  const studyGuide = uniqueStrings(
    (Array.isArray(certRecord.study_guide) ? certRecord.study_guide : []).map((s) => s?.url || s?.uid || s?.title || "")
  );

  return {
    examCode: code,
    examUid,
    title: fallbackExam?.title || certRecord.title || code,
    subtitle: fallbackExam?.subtitle || certRecord.summary || "",
    url: fallbackExam?.url || certRecord.url || "",
    lastModified: fallbackExam?.last_modified || certRecord.last_modified || null,
    pdfUrl: fallbackExam?.pdf_download_url || null,
    practiceAssessmentUrl: null,
    studyGuide,
    relatedCertifications: uniqueStrings([certRecord.title || certRecord.uid || ""]),
    skills,
  };
}

async function fetchCatalog() {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Catalog API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  const payload = await fetchCatalog();
  const exams = Array.isArray(payload.exams) ? payload.exams : [];
  const certs = Array.isArray(payload.certifications) ? payload.certifications : [];
  const merged = Array.isArray(payload.mergedCertifications) ? payload.mergedCertifications : [];
  const certCandidates = [...certs, ...merged];

  const filtered = exams.filter((e) => TARGET_CODES.includes(e.display_name));
  const officialExams = TARGET_CODES.map((code) => {
    const examRecord = filtered.find((exam) => exam.display_name === code);
    if (examRecord) return normalizeExam(examRecord, certCandidates);

    const certUid = CERT_UID_BY_CODE[code];
    const certRecord =
      merged.find((c) => c.uid === certUid && Array.isArray(c.skills) && c.skills.length > 0) ||
      certCandidates.find((c) => c.uid === certUid);
    if (certRecord) return normalizeFromCertification(code, certRecord, examRecord);
    return null;
  }).filter(Boolean).map((record) => {
    if (record.skills.length > 0) return record;
    const certUid = CERT_UID_BY_CODE[record.examCode];
    const mergedMatch = merged.find((c) => c.uid === certUid && Array.isArray(c.skills) && c.skills.length > 0);
    if (!mergedMatch) return record;
    return {
      ...record,
      skills: uniqueStrings(extractSkillStrings(mergedMatch)),
      relatedCertifications: uniqueStrings([...(record.relatedCertifications || []), mergedMatch.title || mergedMatch.uid || ""]),
    };
  });

  if (officialExams.length !== TARGET_CODES.length) {
    const found = officialExams.map((e) => e.examCode).join(", ");
    throw new Error(`Missing target exams. Found: ${found}`);
  }

  const officialPayload = {
    generatedAt: new Date().toISOString(),
    sourceEndpoint: CATALOG_URL,
    exams: officialExams,
  };

  const questionBank = generateQuestionBank(officialExams);

  await mkdir(resolve(rootDir, "src/data"), { recursive: true });
  await writeFile(officialPath, `${JSON.stringify(officialPayload, null, 2)}\n`, "utf8");
  await writeFile(questionPath, `${JSON.stringify(questionBank, null, 2)}\n`, "utf8");

  console.log(`Wrote ${officialPath}`);
  console.log(`Wrote ${questionPath}`);
  for (const exam of officialExams) {
    console.log(`${exam.examCode}: ${exam.skills.length} skills/objectives, ${questionBank[exam.examCode === "AZ-900" ? "1" : exam.examCode === "AZ-104" ? "2" : "3"].length} generated questions`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
