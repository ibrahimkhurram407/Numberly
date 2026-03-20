const LEVELS = [
  { id: 'emotion-match-1', unit: 'Emotions', title: 'Happy and Sad', description: 'Practice recognising basic feelings with calm choices.', lessonType: 'emotionChoice', maxNumber: 0, accent: 'sky', difficultyBand: 'easy', skills: ['emotion-recognition'] },
  { id: 'emotion-match-2', unit: 'Emotions', title: 'Calm or Upset', description: 'Notice how faces and situations can show calm or upset feelings.', lessonType: 'emotionChoice', maxNumber: 0, accent: 'emerald', difficultyBand: 'easy', skills: ['emotion-recognition'] },
  { id: 'routine-order-1', unit: 'Routines', title: 'Morning Routine', description: 'Put simple daily steps in a predictable order.', lessonType: 'routineOrder', maxNumber: 0, accent: 'orange', difficultyBand: 'easy', skills: ['routine', 'sequencing'] },
  { id: 'routine-order-2', unit: 'Routines', title: 'School Routine', description: 'Choose what comes next in a familiar schedule.', lessonType: 'routineOrder', maxNumber: 0, accent: 'violet', difficultyBand: 'medium', skills: ['routine', 'sequencing'] },
  { id: 'social-choice-1', unit: 'Social Skills', title: 'Kind Choices', description: 'Choose kind and safe actions in social situations.', lessonType: 'socialChoice', maxNumber: 0, accent: 'sky', difficultyBand: 'easy', skills: ['social-understanding'] },
  { id: 'social-choice-2', unit: 'Social Skills', title: 'Taking Turns', description: 'Practice simple turn-taking and waiting choices.', lessonType: 'socialChoice', maxNumber: 0, accent: 'emerald', difficultyBand: 'medium', skills: ['social-understanding', 'turn-taking'] },
  { id: 'counting-1', unit: 'Numbers', title: 'Counting 1-5', description: 'Count simple objects with clear visuals.', lessonType: 'count', maxNumber: 5, accent: 'orange', difficultyBand: 'easy', skills: ['counting'] },
  { id: 'counting-2', unit: 'Numbers', title: 'Counting 1-10', description: 'Count more objects while keeping the task routine the same.', lessonType: 'count', maxNumber: 10, accent: 'violet', difficultyBand: 'medium', skills: ['counting'] },
  { id: 'matching-1', unit: 'Matching', title: 'Match the Group', description: 'Match a picture group to the correct number.', lessonType: 'match', maxNumber: 8, accent: 'sky', difficultyBand: 'easy', skills: ['matching'] },
  { id: 'compare-1', unit: 'Comparing', title: 'More or Less', description: 'Choose which group has more objects.', lessonType: 'compare', maxNumber: 8, accent: 'emerald', difficultyBand: 'medium', skills: ['comparison'] },
  { id: 'addition-1', unit: 'Numbers', title: 'Small Addition', description: 'Add two small groups together.', lessonType: 'addition', maxNumber: 8, accent: 'orange', difficultyBand: 'medium', skills: ['addition'] },
  { id: 'sequence-1', unit: 'Patterns', title: 'What Comes Next', description: 'Continue a simple pattern one step at a time.', lessonType: 'sequence', maxNumber: 12, accent: 'violet', difficultyBand: 'medium', skills: ['patterns', 'sequencing'] },
];

const VISUAL_LIBRARY = {
  apple: 'APPLE',
  star: 'STAR',
  ball: 'BALL',
  flower: 'FLOWER',
  faceHappy: 'HAPPY',
  faceSad: 'SAD',
  faceCalm: 'CALM',
  faceUpset: 'UPSET',
};

const EMOTION_SETS = [
  { prompt: 'Which face looks happy?', answer: 'Happy', choices: ['Happy', 'Sad', 'Angry'] },
  { prompt: 'Which face looks calm?', answer: 'Calm', choices: ['Calm', 'Upset', 'Scared'] },
  { prompt: 'Which feeling means someone may need a break?', answer: 'Upset', choices: ['Excited', 'Upset', 'Sleepy'] },
];

const ROUTINE_SETS = [
  { prompt: 'What comes first in the morning routine?', answer: 'Wake up', choices: ['Wake up', 'Brush teeth', 'Go to bed'] },
  { prompt: 'After brushing teeth, what can come next?', answer: 'Put on clothes', choices: ['Put on clothes', 'Go to sleep', 'Eat dinner'] },
  { prompt: 'What comes before lunch at school?', answer: 'Morning class', choices: ['Morning class', 'Bedtime', 'Dinner'] },
];

const SOCIAL_SETS = [
  { prompt: 'Your friend is talking. What is a kind choice?', answer: 'Listen quietly', choices: ['Listen quietly', 'Shout louder', 'Walk away laughing'] },
  { prompt: 'Someone else is using the toy. What can you do?', answer: 'Wait for your turn', choices: ['Grab it', 'Wait for your turn', 'Throw it'] },
  { prompt: 'A classmate looks upset. What could help?', answer: 'Ask if they need help', choices: ['Ask if they need help', 'Point and laugh', 'Run away'] },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createChoices(answer, min, max) {
  const options = new Set([answer]);
  while (options.size < 4) {
    options.add(randomInt(min, max));
  }
  return shuffle(Array.from(options));
}

function pickAsset(assets, index) {
  if (!assets?.length) {
    return null;
  }
  return assets[index % assets.length];
}

function pickScenario(scenarios, index) {
  return scenarios[index % scenarios.length];
}

function buildCountQuestion(level, index, assets) {
  const answer = randomInt(1, level.difficultyBand === 'easy' ? 5 : 10);
  const asset = pickAsset(assets, index);
  if (asset) {
    return {
      id: `${level.id}-q${index + 1}`,
      prompt: `How many ${asset.objectName}s can you see?`,
      narration: `Count the ${asset.objectName}s on the screen.`,
      choices: createChoices(answer, 1, Math.max(answer + 2, 4)),
      answer,
      visualType: 'assetCount',
      visualItems: Array.from({ length: answer }, () => asset.imagePath),
      assetTitle: asset.title,
      assetObjectName: asset.objectName,
      assetKind: 'image',
    };
  }

  return {
    id: `${level.id}-q${index + 1}`,
    prompt: 'How many stars can you see?',
    narration: 'Count the stars on the screen.',
    choices: createChoices(answer, 1, Math.max(answer + 2, 4)),
    answer,
    visualType: 'count',
    visualItems: Array.from({ length: answer }, () => VISUAL_LIBRARY.star),
  };
}

function buildMatchQuestion(level, index, assets) {
  const answer = randomInt(1, 8);
  const asset = pickAsset(assets, index);
  return {
    id: `${level.id}-q${index + 1}`,
    prompt: asset ? `Choose the number that matches the ${asset.objectName} group.` : 'Choose the number that matches the group.',
    narration: 'Look at the group and pick the matching number.',
    choices: createChoices(answer, 1, 10),
    answer,
    visualType: 'assetMatch',
    visualItems: Array.from({ length: answer }, () => (asset ? asset.imagePath : VISUAL_LIBRARY.apple)),
    assetTitle: asset?.title,
    assetObjectName: asset?.objectName,
    assetKind: asset ? 'image' : undefined,
  };
}

function buildCompareQuestion(level, index, assets) {
  const left = randomInt(2, 6);
  const right = randomInt(1, 6);
  const answer = left === right ? 'Same' : left > right ? 'Left' : 'Right';
  const asset = pickAsset(assets, index);
  return {
    id: `${level.id}-q${index + 1}`,
    prompt: asset ? `Which side has more ${asset.objectName}s?` : 'Which side has more objects?',
    narration: 'Look at both sides and choose which one has more.',
    choices: ['Left', 'Right', 'Same'],
    answer,
    visualType: 'assetCompare',
    visualGroups: [
      Array.from({ length: left }, () => (asset ? asset.imagePath : VISUAL_LIBRARY.ball)),
      Array.from({ length: right }, () => (asset ? asset.imagePath : VISUAL_LIBRARY.ball)),
    ],
    assetTitle: asset?.title,
    assetObjectName: asset?.objectName,
    assetKind: asset ? 'image' : undefined,
  };
}

function buildAdditionQuestion(level, index, assets) {
  const left = randomInt(1, 4);
  const right = randomInt(1, 4);
  const answer = left + right;
  const asset = pickAsset(assets, index);
  return {
    id: `${level.id}-q${index + 1}`,
    prompt: asset ? `What is ${left} + ${right} ${asset.objectName}s?` : `What is ${left} + ${right}?`,
    narration: `Add ${left} and ${right}.`,
    choices: createChoices(answer, 1, 10),
    answer,
    visualType: 'assetAddition',
    visualGroups: [
      Array.from({ length: left }, () => (asset ? asset.imagePath : VISUAL_LIBRARY.apple)),
      Array.from({ length: right }, () => (asset ? asset.imagePath : VISUAL_LIBRARY.apple)),
    ],
    assetTitle: asset?.title,
    assetObjectName: asset?.objectName,
    assetKind: asset ? 'image' : undefined,
  };
}

function buildSequenceQuestion(level, index) {
  const start = randomInt(1, 5);
  const step = index % 2 === 0 ? 1 : 2;
  const sequence = [start, start + step, start + step * 2];
  const answer = start + step * 3;
  return {
    id: `${level.id}-q${index + 1}`,
    prompt: `What comes next: ${sequence.join(', ')} ?`,
    narration: 'Find the next number in the pattern.',
    choices: createChoices(answer, start, answer + 3),
    answer,
    visualType: 'sequence',
    sequence,
  };
}

function buildEmotionQuestion(level, index) {
  const scenario = pickScenario(EMOTION_SETS, index);
  return {
    id: `${level.id}-q${index + 1}`,
    prompt: scenario.prompt,
    narration: scenario.prompt,
    choices: scenario.choices,
    answer: scenario.answer,
    visualType: 'choiceOnly',
  };
}

function buildRoutineQuestion(level, index) {
  const scenario = pickScenario(ROUTINE_SETS, index);
  return {
    id: `${level.id}-q${index + 1}`,
    prompt: scenario.prompt,
    narration: scenario.prompt,
    choices: scenario.choices,
    answer: scenario.answer,
    visualType: 'choiceOnly',
  };
}

function buildSocialQuestion(level, index) {
  const scenario = pickScenario(SOCIAL_SETS, index);
  return {
    id: `${level.id}-q${index + 1}`,
    prompt: scenario.prompt,
    narration: scenario.prompt,
    choices: scenario.choices,
    answer: scenario.answer,
    visualType: 'choiceOnly',
  };
}

export function getLevels() {
  return LEVELS;
}

export function createQuestionFromTemplate(template) {
  const payload = template.templatePayload ?? {};
  const visualItems = payload.visualItems ?? (template.assetImagePath ? [template.assetImagePath] : undefined);
  return {
    id: `template-${template.id}`,
    prompt: template.prompt,
    narration: template.narration,
    choices: template.choices,
    answer: template.answer,
    visualType: template.visualType,
    visualItems,
    visualGroups: payload.visualGroups,
    sequence: payload.sequence,
    assetTitle: template.assetTitle,
    assetObjectName: template.assetObjectName,
    assetKind: template.assetImagePath ? 'image' : payload.assetKind,
  };
}

export function generateQuestions(levelId, count = 5, assets = []) {
  const level = LEVELS.find((entry) => entry.id === levelId) ?? LEVELS[0];

  return Array.from({ length: count }, (_, index) => {
    switch (level.lessonType) {
      case 'emotionChoice':
        return buildEmotionQuestion(level, index);
      case 'routineOrder':
        return buildRoutineQuestion(level, index);
      case 'socialChoice':
        return buildSocialQuestion(level, index);
      case 'match':
        return buildMatchQuestion(level, index, assets);
      case 'compare':
        return buildCompareQuestion(level, index, assets);
      case 'addition':
        return buildAdditionQuestion(level, index, assets);
      case 'sequence':
        return buildSequenceQuestion(level, index);
      case 'count':
      default:
        return buildCountQuestion(level, index, assets);
    }
  });
}
