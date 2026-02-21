import {
  PHASES,
  TAGS,
  MG1_QUESTIONS,
  MG2_IMPORTANT_OPTIONS,
  MG2_NOWANT_OPTIONS,
} from '../public/data.js';
import { TIMERS } from './timers.js';

function randomDelay() {
  return TIMERS.BOT_ANSWER_MIN + Math.random() * (TIMERS.BOT_ANSWER_MAX - TIMERS.BOT_ANSWER_MIN);
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function scheduleBotAnswerMG1(room, question, submitAnswer) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const numPicks = 1 + Math.floor(Math.random() * Math.min(2, question.maxSelect));
    const picks = pickRandom(question.options, numPicks).map(o => o.id);
    submitAnswer(room, bot, {
      phase: PHASES.MG1,
      questionId: question.id,
      answer: picks
    });
  }, randomDelay());
}

export function scheduleBotAnswerMG2Important(room, submitAnswer) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const picks = pickRandom(MG2_IMPORTANT_OPTIONS, 3).map(o => o.id);
    submitAnswer(room, bot, {
      phase: PHASES.MG2_IMPORTANT,
      questionId: 'mg2_important',
      answer: picks
    });
  }, randomDelay());
}

export function scheduleBotAnswerMG2NoWant(room, submitAnswer) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const picks = pickRandom(MG2_NOWANT_OPTIONS, 3).map(o => o.id);
    submitAnswer(room, bot, {
      phase: PHASES.MG2_NOWANT,
      questionId: 'mg2_nowant',
      answer: picks
    });
  }, randomDelay());
}

export function scheduleBotAnswerMG3(room, submitAnswer) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const sliderAnswers = {};
    for (const tag of TAGS) {
      sliderAnswers[tag] = 1 + Math.floor(Math.random() * 5);
    }
    submitAnswer(room, bot, {
      phase: PHASES.MG3,
      questionId: 'mg3',
      answer: sliderAnswers
    });
  }, randomDelay());
}

export function fillBotAnswersForCurrentPhase(room, player, submitAnswer) {
  switch (room.phase) {
    case PHASES.MG1: {
      const question = MG1_QUESTIONS[room.currentQuestionIndex];
      if (question) {
        const key = `mg1_${question.id}`;
        if (player.answers[key] === undefined) {
          scheduleBotAnswerMG1(room, question, submitAnswer);
        }
      }
      break;
    }
    case PHASES.MG2_IMPORTANT:
      if (player.answers.mg2_important === undefined) {
        scheduleBotAnswerMG2Important(room, submitAnswer);
      }
      break;
    case PHASES.MG2_NOWANT:
      if (player.answers.mg2_nowant === undefined) {
        scheduleBotAnswerMG2NoWant(room, submitAnswer);
      }
      break;
    case PHASES.MG3:
      if (player.answers.mg3 === undefined) {
        scheduleBotAnswerMG3(room, submitAnswer);
      }
      break;
  }
}
