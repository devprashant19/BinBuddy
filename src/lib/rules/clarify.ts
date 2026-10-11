import { Clarification } from '../schemas/result';

export function getMaterialClarification(): Clarification {
  return {
    id: 'material',
    question: 'What is this item mostly made of?',
    options: [
      { label: 'Plastic', value: 'plastic' },
      { label: 'Paper or cardboard', value: 'paper' },
      { label: 'Glass', value: 'glass' },
      { label: 'Metal', value: 'metal' },
      { label: 'Not sure', value: 'not_sure' },
    ],
  };
}

export function getConditionClarification(): Clarification {
  return {
    id: 'condition',
    question: 'Is it clean, empty, and dry?',
    options: [
      { label: 'Yes, clean and empty', value: 'clean' },
      { label: 'No, food-soiled or greasy', value: 'soiled' },
      { label: 'Not sure', value: 'not_sure' },
    ],
  };
}

export function getResinClarification(): Clarification {
  return {
    id: 'resin',
    question: 'Is there a recycling number inside the chasing arrows?',
    options: [
      { label: '#1 (PET) or #2 (HDPE) bottle/jug', value: '1' },
      { label: '#5 (PP) container', value: '5' },
      { label: '#6 (Polystyrene / Foam)', value: '6' },
      { label: 'Other number (#3, #4, #7)', value: '7' },
      { label: 'Cannot find it / Not sure', value: 'not_sure' },
    ],
  };
}
