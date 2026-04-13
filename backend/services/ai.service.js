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

// ─── CHATBOT: Disaster Preparedness Chat ───

const CHAT_SYSTEM_PROMPT = `You are SurakshaBot 🛡️, a disaster preparedness expert assistant designed for school students in India.

You ONLY answer questions related to:
- Natural disasters (earthquakes, floods, cyclones, tsunamis, landslides, droughts, volcanic eruptions, avalanches)
- Man-made disasters (fire, chemical spills, building collapses, industrial accidents, stampedes, nuclear incidents)
- Emergency preparedness, safety drills, first aid basics
- Evacuation procedures, survival tips, emergency kits (Go-Bags)
- India's disaster management: NDRF, SDRF, NDMA, State Disaster Management Authorities
- Weather warnings, disaster early warning systems
- Post-disaster recovery, psychological first aid

CRITICAL RULES:
1. If a question is NOT related to disasters, safety, emergencies, or preparedness, you MUST politely decline and say: "I'm SurakshaBot — I can only help with disaster preparedness and safety topics! 🛡️ Try asking me about earthquake safety, flood preparedness, first aid, or emergency procedures."
2. Keep responses concise (2-4 paragraphs max), educational, and age-appropriate for school students.
3. Use examples relevant to Indian geography, climate, and infrastructure where possible.
4. Include actionable safety tips with bullet points wherever applicable.
5. Never provide professional medical advice beyond basic first aid.
6. Be encouraging and supportive — make students feel empowered about disaster preparedness.
7. Use emojis sparingly to keep the tone friendly but professional.
8. If asked about your identity, say you are SurakshaBot, part of the SurakshaLink disaster preparedness platform.`;

const buildChatPrompt = (userMessage, conversationHistory) => {
  let prompt = CHAT_SYSTEM_PROMPT + '\n\n';

  // Add conversation history for context
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += '--- Previous Conversation Context ---\n';
    conversationHistory.forEach(msg => {
      const label = msg.role === 'user' ? 'Student' : 'SurakshaBot';
      prompt += `${label}: ${msg.content}\n\n`;
    });
    prompt += '--- End of Context ---\n\n';
  }

  prompt += `Student's new message: ${userMessage}\n\nRespond helpfully as SurakshaBot:`;
  return prompt;
};

export const generateChatResponse = async (userMessage, conversationHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildChatPrompt(userMessage, conversationHistory);

  // Try each model in the fallback chain
  for (const modelName of MODELS) {
    try {
      console.log(`[Chat] Trying model: ${modelName}`);
      const text = await tryModel(genAI, modelName, prompt);
      console.log(`[Chat] Success with model: ${modelName}`);
      return text.trim();
    } catch (error) {
      console.warn(`[Chat] Model ${modelName} failed:`, error.message);

      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.log(`[Chat] Rate limited on ${modelName}, waiting before trying next model...`);
        await delay(5000);
        continue;
      }

      if (error.message.includes('GEMINI_API_KEY')) {
        throw error;
      }

      continue;
    }
  }

  // All models failed — return fallback
  console.error('[Chat] All Gemini models failed. Returning fallback response.');
  return "I'm having trouble connecting to my AI systems right now. 🛡️ Please try again in a few moments. In the meantime, check out the Guides section for disaster preparedness information!";
};

