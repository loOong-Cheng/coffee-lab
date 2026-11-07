/** Pure logic for single-answer quizzes with misconception feedback (QuizActivity). */
import type { LocalizedText, QuizActivity } from '../../../domain/contracts';

export type QuizQuestion = QuizActivity['questions'][number];

export interface OptionEvaluation {
  correct: boolean;
  /** Feedback tied to the misconception behind THIS option (or praise for the right one). */
  feedback: LocalizedText;
  /** The general explanation of the question (always available after an answer). */
  explanation: LocalizedText;
  correctOptionId: string | undefined;
}

export function correctOptionId(q: QuizQuestion): string | undefined {
  return q.options.find((o) => o.correct)?.id;
}

/** Evaluate one picked option. Unknown ids are treated as wrong with the general explanation. */
export function evaluateOption(q: QuizQuestion, optionId: string): OptionEvaluation {
  const option = q.options.find((o) => o.id === optionId);
  return {
    correct: !!option?.correct,
    feedback: option?.feedback ?? q.explanation,
    explanation: q.explanation,
    correctOptionId: correctOptionId(q),
  };
}

/** Per-question attempt log: ordered option ids the learner picked. */
export type QuizAttempts = Record<string, string[]>;

export function recordAttempt(attempts: QuizAttempts, questionId: string, optionId: string): QuizAttempts {
  return { ...attempts, [questionId]: [...(attempts[questionId] ?? []), optionId] };
}

export function answeredCorrectly(q: QuizQuestion, attempts: QuizAttempts): boolean {
  return (attempts[q.id] ?? []).some((id) => evaluateOption(q, id).correct);
}

export function firstTryCorrect(q: QuizQuestion, attempts: QuizAttempts): boolean {
  const first = attempts[q.id]?.[0];
  return first !== undefined && evaluateOption(q, first).correct;
}

/** Share of questions answered right on the FIRST try (0..1) — retries help learning, not the score. */
export function quizScore(questions: readonly QuizQuestion[], attempts: QuizAttempts): number {
  if (questions.length === 0) return 0;
  return questions.filter((q) => firstTryCorrect(q, attempts)).length / questions.length;
}

/** All questions eventually answered correctly → the check is complete. */
export function quizComplete(questions: readonly QuizQuestion[], attempts: QuizAttempts): boolean {
  return questions.length > 0 && questions.every((q) => answeredCorrectly(q, attempts));
}
