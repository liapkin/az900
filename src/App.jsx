import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  Flag,
  BookOpen,
  BarChart3,
  CircleDashed,
  ChevronLeft,
  ChevronRight,
  Layers3,
} from "lucide-react";
import generatedQuestionBank from "./data/generatedQuestionBank.json";
import officialExamsPayload from "./data/officialExams.json";
import "./App.css";

function Card({ className = "", children }) {
  return <div className={className}>{children}</div>;
}

function CardContent({ className = "", children }) {
  return <div className={className}>{children}</div>;
}

function Button({ className = "", variant, children, ...props }) {
  const variantClasses = variant === "secondary" ? "btn btn--secondary" : "btn btn--primary";
  return (
    <button type="button" className={`${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}

const LEVEL_CONFIG = {
  1: {
    title: "AZ-900 Fundamentals",
    subtitle: "Official objectives and metadata from Microsoft Learn.",
    minutes: 45,
    badge: "Level 1",
    examCode: "AZ-900",
  },
  2: {
    title: "AZ-104 Administrator",
    subtitle: "Official objectives and metadata from Microsoft Learn.",
    minutes: 60,
    badge: "Level 2",
    examCode: "AZ-104",
  },
  3: {
    title: "AZ-305 Architect",
    subtitle: "Official objectives and metadata from Microsoft Learn.",
    minutes: 75,
    badge: "Level 3",
    examCode: "AZ-305",
  },
};

const LEVEL_QUESTIONS = generatedQuestionBank;
const OFFICIAL_BY_CODE = Object.fromEntries((officialExamsPayload.exams || []).map((exam) => [exam.examCode, exam]));

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function readiness(score) {
  if (score >= 85) return { label: "Ready", message: "Strong result for this level. Keep exam pacing and review weak domains." };
  if (score >= 75) return { label: "Almost Ready", message: "Good baseline. Refine weak areas, then take one more timed run." };
  if (score >= 60) return { label: "Needs Review", message: "You have partial mastery. Focus revision on lowest scoring domains." };
  return { label: "Not Ready Yet", message: "Rebuild fundamentals and repeat with slower, deliberate review." };
}

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

export default function AzurePracticeExam() {
  const [level, setLevel] = useState(1);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(LEVEL_CONFIG[1].minutes * 60);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [reviewOnly, setReviewOnly] = useState(false);

  const questions = LEVEL_QUESTIONS[level];
  const officialExam = OFFICIAL_BY_CODE[LEVEL_CONFIG[level].examCode];
  const selected = answers[current];
  const question = questions[current];
  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(() => questions.filter((q, i) => answers[i] === q.answer).length, [answers, questions]);
  const score = Math.round((correctCount / questions.length) * 100);
  const readinessResult = readiness(score);

  useEffect(() => {
    if (!started || submitted) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setSubmitted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, submitted]);

  const domainStats = useMemo(() => {
    const stats = {};
    questions.forEach((q, index) => {
      if (!stats[q.domain]) stats[q.domain] = { total: 0, correct: 0, answered: 0 };
      stats[q.domain].total += 1;
      if (answers[index] !== undefined) stats[q.domain].answered += 1;
      if (answers[index] === q.answer) stats[q.domain].correct += 1;
    });
    return stats;
  }, [answers, questions]);

  function selectAnswer(index) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [current]: index }));
    if (autoAdvance && current < questions.length - 1) {
      setCurrent((c) => Math.min(questions.length - 1, c + 1));
    }
  }

  function resetExam(nextLevel = level) {
    setStarted(false);
    setCurrent(0);
    setAnswers({});
    setFlagged({});
    setSubmitted(false);
    setReviewOnly(false);
    setTimeLeft(LEVEL_CONFIG[nextLevel].minutes * 60);
  }

  function startExam() {
    resetExam(level);
    setStarted(true);
  }

  function switchLevel(nextLevel) {
    setLevel(nextLevel);
    resetExam(nextLevel);
  }

  function gotoFirstUnanswered() {
    const next = questions.findIndex((_, i) => answers[i] === undefined);
    if (next !== -1) setCurrent(next);
  }

  function submitExam() {
    if (!submitted && answeredCount < questions.length) {
      const proceed = window.confirm(`You still have ${questions.length - answeredCount} unanswered questions. Submit anyway?`);
      if (!proceed) return;
    }
    setSubmitted(true);
  }

  const reviewQuestionIndices = useMemo(
    () => questions.map((_, i) => i).filter((i) => !reviewOnly || flagged[i] || answers[i] === undefined),
    [reviewOnly, flagged, answers, questions]
  );

  return (
    <div className="exam-shell">
      <div className="grain" />
      <div className="exam-container">
        <header className="exam-header card">
          <div className="hero-copy">
            <p className="eyebrow">Microsoft Azure Certificate Trainer</p>
            <h1>{LEVEL_CONFIG[level].title}</h1>
            <p className="hero-subtitle">{LEVEL_CONFIG[level].subtitle}</p>
          </div>
          <div className="stats-grid">
            <div className="stat-box">
              <Clock className="icon ember" />
              <div className="stat-value">{formatTime(timeLeft)}</div>
              <div className="stat-label">Timer</div>
            </div>
            <div className="stat-box">
              <BarChart3 className="icon cyan" />
              <div className="stat-value">{answeredCount}/{questions.length}</div>
              <div className="stat-label">Answered</div>
            </div>
            <div className="stat-box">
              <Award className="icon lime" />
              <div className="stat-value">{submitted ? `${score}%` : "--"}</div>
              <div className="stat-label">Score</div>
            </div>
          </div>
        </header>

        {!started ? (
          <div className="start-grid">
            <Card className="card">
              <CardContent className="panel">
                <h2>Choose level</h2>
                <p>Switch between fundamentals, administrator, and architect question tracks. Each level has dedicated timing and scenario depth.</p>
                <div className="level-grid">
                  {Object.entries(LEVEL_CONFIG).map(([k, cfg]) => {
                    const numeric = Number(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        className={classNames("level-card", level === numeric && "active")}
                        onClick={() => switchLevel(numeric)}
                      >
                        <div className="domain-title">
                          <span>{cfg.badge}</span>
                          <span>{cfg.minutes}m</span>
                        </div>
                        <h3>{cfg.title}</h3>
                        <div className="domain-meta">{cfg.subtitle}</div>
                        <div className="domain-meta">Official exam: {cfg.examCode}</div>
                      </button>
                    );
                  })}
                </div>
                <Button onClick={startExam} className="btn-primary">Start practice exam</Button>
              </CardContent>
            </Card>
            <Card className="card">
              <CardContent className="panel">
                <BookOpen className="feature-icon ember" />
                <h3>Readiness scale</h3>
                <div className="scale-list">
                  <p><span className="score-ready">85%+</span> Ready</p>
                  <p><span className="score-almost">75-84%</span> Almost ready</p>
                  <p><span className="score-review">60-74%</span> Needs review</p>
                  <p><span className="score-notready">Below 60%</span> Not ready yet</p>
                </div>
                <div className="level-pill"><Layers3 className="icon-inline" /> {LEVEL_CONFIG[level].badge} selected</div>
                {officialExam && (
                  <div className="source-links">
                    <p className="domain-meta">Official source links</p>
                    <p><a href={officialExam.url} target="_blank" rel="noreferrer">Exam page ({officialExam.examCode})</a></p>
                    {officialExam.pdfUrl && <p><a href={officialExam.pdfUrl} target="_blank" rel="noreferrer">Skills measured PDF</a></p>}
                    {officialExam.practiceAssessmentUrl && <p><a href={officialExam.practiceAssessmentUrl} target="_blank" rel="noreferrer">Practice assessment</a></p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="exam-grid">
            <aside className="card sidebar">
              <div className="progress-header">
                <h2>Progress</h2>
                <Button variant="secondary" onClick={() => resetExam(level)} className="btn-secondary"><RotateCcw className="icon-inline" />Reset</Button>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
              </div>
              <div className="toolbar">
                <button type="button" className="text-button" onClick={gotoFirstUnanswered}>
                  <CircleDashed className="icon-inline" />Jump to first unanswered
                </button>
                <label className="checkline">
                  <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
                  Auto-advance after answer
                </label>
                <label className="checkline">
                  <input type="checkbox" checked={reviewOnly} onChange={(e) => setReviewOnly(e.target.checked)} />
                  Show unanswered + flagged only
                </label>
              </div>
              <div className="question-grid">
                {reviewQuestionIndices.map((i) => {
                  const isCurrent = i === current;
                  const isAnswered = answers[i] !== undefined;
                  const isFlagged = flagged[i];
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={classNames(
                        "question-pill",
                        isCurrent && "current",
                        isAnswered && "answered",
                        submitted && answers[i] === questions[i].answer && "correct",
                        submitted && answers[i] !== undefined && answers[i] !== questions[i].answer && "incorrect"
                      )}
                    >
                      {i + 1}
                      {isFlagged && <Flag className="flag-mark" />}
                    </button>
                  );
                })}
              </div>
              <div className="domain-progress-list">
                {Object.entries(domainStats).map(([domain, s]) => (
                  <div key={domain} className="domain-progress-item">
                    <div className="domain-progress-head"><span>{domain}</span><span>{submitted ? `${s.correct}/${s.total}` : `${s.answered}/${s.total}`}</span></div>
                    <div className="mini-track">
                      <div className="mini-fill" style={{ width: `${((submitted ? s.correct : s.answered) / s.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main>
              {!submitted ? (
                <div key={current}>
                    <Card className="card">
                      <CardContent className="panel">
                        <div className="question-header">
                          <div>
                            <div className="question-counter">Question {current + 1} of {questions.length}</div>
                            <div className="question-domain">{question.domain}</div>
                          </div>
                          <Button variant="secondary" onClick={() => setFlagged((p) => ({ ...p, [current]: !p[current] }))} className="btn-secondary">
                            <Flag className="icon-inline" />{flagged[current] ? "Unflag" : "Flag"}
                          </Button>
                        </div>
                        <h2 className="question-title">{question.question}</h2>
                        <div className="options-list">
                          {question.options.map((option, i) => (
                            <button
                              key={option}
                              onClick={() => selectAnswer(i)}
                              className={classNames("option-button", selected === i && "selected")}
                            >
                              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                              {option}
                            </button>
                          ))}
                        </div>
                        <div className="question-actions">
                          <Button variant="secondary" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="btn-secondary"><ChevronLeft className="icon-inline" />Previous</Button>
                          <div className="action-group">
                            <Button variant="secondary" onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1} className="btn-secondary">Next<ChevronRight className="icon-inline" /></Button>
                            <Button onClick={submitExam} className="btn-primary">Submit exam</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                </div>
              ) : (
                <div className="results-stack">
                  <Card className="card">
                    <CardContent className="panel">
                      <div className="results-head">
                        <div>
                          <p className="eyebrow">Final result</p>
                          <h2>{score}% - {readinessResult.label}</h2>
                          <p>{readinessResult.message}</p>
                          <p className="result-meta">{LEVEL_CONFIG[level].badge} | Correct answers: {correctCount} / {questions.length}. Time remaining: {formatTime(timeLeft)}.</p>
                          {officialExam && <p className="result-meta">Question source: Official Microsoft Learn objectives ({officialExam.examCode}).</p>}
                        </div>
                        <div className="readiness-badge">
                          <Award className="icon lime" />
                          <div className="badge-number">{score}</div>
                          <div className="stat-label">Readiness score</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card">
                    <CardContent className="panel">
                      <h3>Domain breakdown</h3>
                      <div className="domain-breakdown-grid">
                        {Object.entries(domainStats).map(([domain, s]) => {
                          const pct = Math.round((s.correct / s.total) * 100);
                          return (
                            <div key={domain} className="domain-card">
                              <div className="domain-row"><span>{domain}</span><span>{pct}%</span></div>
                              <div className="progress-track"><div className="progress-fill green" style={{ width: `${pct}%` }} /></div>
                              <div className="domain-meta">{s.correct} correct out of {s.total}</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="review-list">
                    {questions.map((q, i) => {
                      const userAnswer = answers[i];
                      const correct = userAnswer === q.answer;
                      return (
                        <Card key={i} className="card">
                          <CardContent className="review-card">
                            <div className="review-head">
                              <div className="question-counter">Question {i + 1} | {q.domain}</div>
                              {correct ? <span className="status-badge correct"><CheckCircle2 className="icon-inline" />Correct</span> : <span className="status-badge incorrect"><XCircle className="icon-inline" />Incorrect</span>}
                            </div>
                            <h4>{q.question}</h4>
                            <div className="review-options">
                              {q.options.map((option, optIndex) => (
                                <div key={option} className={classNames("review-option", optIndex === q.answer && "review-correct", userAnswer === optIndex && userAnswer !== q.answer && "review-wrong")}>
                                  <span className="option-letter">{String.fromCharCode(65 + optIndex)}</span> {option}
                                </div>
                              ))}
                            </div>
                            <div className="explanation"><span className="label">Explanation:</span> {q.explanation}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
