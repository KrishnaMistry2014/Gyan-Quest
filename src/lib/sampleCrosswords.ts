import { CrosswordData } from '../types';

export const SAMPLE_CROSSWORDS: CrosswordData[] = [
  {
    id: 'gita-6-17',
    title: 'Bhagavad Gita: Dhyana Yoga (Verse 6.17)',
    theme: 'Timeless wisdom on prioritization, balanced habits, eating, sleeping, and mindful work.',
    summary: 'Exploration of Bhagavad Gita Chapter 6 Verse 6.17 emphasizing how regulated habits in eating, sleeping, recreation, and work eliminate stress and bring success.',
    gridSize: 12,
    words: [
      { id: '1_down', number: 1, direction: 'down', answer: 'AHARA', clue: 'Diet and food consumption habits', row: 0, col: 7 },
      { id: '2_across', number: 2, direction: 'across', answer: 'FOCUS', clue: 'Mental concentration without distractions', row: 1, col: 0 },
      { id: '3_down', number: 3, direction: 'down', answer: 'SLEEP', clue: 'Rest and circadian rhythm required for cognitive clarity', row: 1, col: 4 },
      { id: '4_across', number: 4, direction: 'across', answer: 'HABIT', clue: 'Behavior formed by repeating tasks consistently for 21 days', row: 1, col: 7 },
      { id: '5_across', number: 5, direction: 'across', answer: 'ENERGY', clue: 'Vital fuel produced in the body through healthy routine', row: 3, col: 4 },
      { id: '6_down', number: 6, direction: 'down', answer: 'YUKTA', clue: 'Regulated, balanced, and disciplined in habits', row: 3, col: 9 },
      { id: '7_down', number: 7, direction: 'down', answer: 'WORK', clue: 'Discharging duties and studies with full devotion and focus', row: 6, col: 7 },
      { id: '8_across', number: 8, direction: 'across', answer: 'YOGA', clue: 'Spiritual practice and disciplined union of mind and action', row: 7, col: 6 },
    ],
    glossary: [
      { term: 'Yukta', definition: 'Regulated and balanced in habits of eating, sleeping, and work.' },
      { term: 'Ahara', definition: 'Nutritious diet that fuels the body like clean fuel for a machine.' },
      { term: 'Yoga', definition: 'Unified practice of discipline that diminishes pain and mental clutter.' },
      { term: 'Habit', definition: 'Formed by repeating conscious positive routines for 21 days.' },
    ],
  },
  {
    id: 'student-success',
    title: 'Student Success & Timeless Wisdom',
    theme: 'Architecting your own success through balance, study habits, and mental rejuvenation.',
    summary: 'A guide for students to manage homework, avoid burnout through healthy breaks, and cultivate gratitude and memory.',
    gridSize: 11,
    words: [
      { id: '1_down', number: 1, direction: 'down', answer: 'BALANCE', clue: 'Equilibrium between effort, rest, and recreation', row: 0, col: 3 },
      { id: '2_across', number: 2, direction: 'across', answer: 'HEALTH', clue: 'Physical and mental vitality maintained by proper habits', row: 1, col: 1 },
      { id: '3_down', number: 3, direction: 'down', answer: 'WISDOM', clue: 'Timeless ancient knowledge guiding life decisions', row: 3, col: 5 },
      { id: '4_across', number: 4, direction: 'across', answer: 'SUCCESS', clue: 'Achievement resulting from balanced discipline and focus', row: 5, col: 0 },
      { id: '4_down', number: 4, direction: 'down', answer: 'STUDY', clue: 'Acquiring knowledge and completing academic duties', row: 5, col: 0 },
    ],
    glossary: [
      { term: 'Balance', definition: 'Maintaining equilibrium between study duties and rest.' },
      { term: 'Wisdom', definition: 'Ancient teachings applied to modern student life.' },
      { term: 'Break', definition: 'Recreational hobbies that refresh the mind and prevent burnout.' },
    ],
  },
];
