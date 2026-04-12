import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service — Gemini integration for quiz performance analysis
 * Uses the Google Generative AI SDK with the free Gemini API
 */

const buildPrompt = (quiz, result) => {
  // Map student answers to readable format
  const questionAnalysis = quiz.questions.map((q, i) => {
    const studentAnswerIdx = result.answers[i];
    const correctIdx = q.correctOptionIndex;
    const isCorrect = studentAnswerIdx === correctIdx;

    const optionsStr = q.options
      .map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt}`)
      .join('  ');

    const studentAnswer = studentAnswerIdx !== undefined && studentAnswerIdx !== null
      ? `${String.fromCharCode(65 + studentAnswerIdx)}) ${q.options[studentAnswerIdx]}`
      : 'Not answered';

    const correctAnswer = `${String.fromCharCode(65 + correctIdx)}) ${q.options[correctIdx]}`;

    return `Q${i + 1}: ${q.questionText}
Options: ${optionsStr}
Student's Answer: ${studentAnswer} | Correct Answer: ${correctAnswer} | ${isCorrect ? '✅ Correct' : '❌ Wrong'}`;
  }).join('\n\n');

  return `You are an expert educational tutor analyzing a student's quiz performance on disaster preparedness and safety drills.

Quiz Title: ${quiz.title}
${quiz.description ? `Quiz Description: ${quiz.description}` : ''}
Student Score: ${result.score}% (${result.correctAnswers}/${result.totalQuestions} correct)
Time Taken: ${result.timeTaken || 'N/A'} seconds
${result.violations > 0 ? `Violations: ${result.violations} (tab switches/fullscreen exits)` : ''}
${result.terminatedBySystem ? 'Note: This quiz was auto-terminated due to excessive violations.' : ''}

Here are the quiz questions and the student's answers:

${questionAnalysis}

---

Please provide a structured performance summary in the following JSON format:
{
  "overallAssessment": "Brief 2-3 sentence assessment of the student's performance. Be specific about what they did well and what needs improvement.",
  "weakTopics": ["Topic/concept area 1 where student struggled", "Topic/concept area 2"],
  "strongTopics": ["Topic/concept area where student did well"],
  "wrongAnswerAnalysis": [
    {
      "questionNumber": 1,
      "topic": "the relevant topic or concept area",
      "explanation": "Why the correct answer is right and what concept the student likely misunderstood"
    }
  ],
  "recommendations": ["Specific actionable study recommendation 1", "Specific actionable study recommendation 2"],
  "encouragement": "A brief motivational message tailored to their performance level"
}

IMPORTANT RULES:
- Return ONLY valid JSON. No markdown, no code fences, no extra text.
- wrongAnswerAnalysis should ONLY include questions the student got wrong.
- If the student got 100%, set wrongAnswerAnalysis to an empty array and focus on positive reinforcement.
- Keep explanations concise but educational.
- Recommendations should be specific to the topics they struggled with.`;
};

// Models to try in order (fallback chain)
const MODELS = [
  'gemini-2.5-flash',        // Primary — 0/5 used
  'gemini-2.5-flash-lite',   // Backup 1 — 1/10 used
  'gemini-3-flash-preview',        // Backup 2 — 0/5 used
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash-preview-tts'   // Backup 3 — 0/15 used (most quota)
];

// Helper: delay for retry
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Try calling Gemini with a specific model
const tryModel = async (genAI, modelName, prompt) => {
  const model = genAI.getGenerativeModel({ model: modelName });
  const generationResult = await model.generateContent(prompt);
  const response = generationResult.response;
  return response.text();
};

// Parse and validate the AI response
const parseAIResponse = (text) => {
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  cleanText = cleanText.trim();

  const summary = JSON.parse(cleanText);

  const requiredFields = ['overallAssessment', 'weakTopics', 'wrongAnswerAnalysis', 'recommendations', 'encouragement'];
  for (const field of requiredFields) {
    if (!(field in summary)) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  return summary;
};

export const generateQuizSummary = async (quiz, result) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(quiz, result);

  // Try each model in the fallback chain
  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      const text = await tryModel(genAI, modelName, prompt);
      const summary = parseAIResponse(text);
      console.log(`Success with model: ${modelName}`);
      return summary;
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);

      // If rate limited, wait and retry once with the same model
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.log(`Rate limited on ${modelName}, waiting 30s before trying next model...`);
        await delay(5000); // Short delay before trying next model
        continue;
      }

      // If it's a config error, throw immediately
      if (error.message.includes('GEMINI_API_KEY')) {
        throw error;
      }

      // Otherwise try next model
      continue;
    }
  }

  // All models failed — return fallback summary
  console.error('All Gemini models failed. Returning fallback summary.');
  return {
    overallAssessment: `You scored ${result.score}% on this quiz, getting ${result.correctAnswers} out of ${result.totalQuestions} questions correct. ${result.score >= 70 ? 'Good effort!' : 'There is room for improvement.'}`,
    weakTopics: result.wrongAnswers > 0 ? ['Review the questions you got wrong below'] : [],
    strongTopics: result.correctAnswers > 0 ? ['You demonstrated knowledge in some areas'] : [],
    wrongAnswerAnalysis: [],
    recommendations: [
      'Review the study material related to the questions you missed',
      'Try attempting the quiz again after studying'
    ],
    encouragement: result.score >= 70
      ? 'Great job! Keep up the good work and aim even higher!'
      : 'Don\'t give up! Every attempt is a learning opportunity. Review the material and try again!',
    _fallback: true
  };
};
