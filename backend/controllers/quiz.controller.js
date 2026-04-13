import mongoose from 'mongoose';
import Quiz from '../models/quiz.model.js';
import Result from '../models/result.model.js';
import User from '../models/user.model.js';
import { generateQuizSummary } from '../services/ai.service.js';
import { resetDailyCredits, deductCredit } from './aiCredits.controller.js';

// 1. TEACHER: Create a new Drill/Quiz
export const createQuiz = async (req, res) => {
  try {
    const { title, description, timeLimit, questions } = req.body;

    // Automatically link to the logged-in Teacher's School ID
    const newQuiz = new Quiz({
      title,
      description,
      timeLimit,
      questions,
      createdBy: req.user.id,
      schoolId: req.user.schoolId // This enables the "Shared Library" feature
    });

    await newQuiz.save();
    res.status(201).json({ message: "Quiz Created Successfully!", quizId: newQuiz._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 1.1 TEACHER: Delete a Quiz
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Ensure only the creator or admin can delete
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    
    // Also delete associated results
    await Result.deleteMany({ quizId: req.params.id });

    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. STUDENT: Get All Quizzes (The Lobby)
export const getQuizzes = async (req, res) => {
  try {
    // Queries purely by School ID, so students see ALL quizzes in their school
    const quizzes = await Quiz.find({ schoolId: req.user.schoolId })
      .select('title description timeLimit xpReward questions.length')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. STUDENT: Play Mode (Sanitized Fetch)
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // SECURITY: We map the data to REMOVE 'correctOptionIndex' 
    // This prevents students from inspecting the network tab to cheat.
    const sanitizedQuestions = quiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options
    }));

    res.json({
      _id: quiz._id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      xpReward: quiz.xpReward,
      questions: sanitizedQuestions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. STUDENT: Submit Engine (Server-Side Grading)
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeTaken, violations = 0, terminatedBySystem = false } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let correctCount = 0;

    // Build per-question detail for the response
    const questionDetails = [];

    // Grade the quiz securely on the server
    quiz.questions.forEach((question, index) => {
      const isCorrect = answers[index] === question.correctOptionIndex;
      if (isCorrect) correctCount++;

      questionDetails.push({
        questionText: question.questionText,
        options: question.options,
        studentAnswerIndex: answers[index] !== undefined ? answers[index] : null,
        correctAnswerIndex: question.correctOptionIndex,
        isCorrect
      });
    });

    // Calculate XP (Gamification Logic)
    const percentage = correctCount / quiz.questions.length;
    let baseXP = Math.round(percentage * quiz.xpReward);

    // --- XP BONUS SYSTEM ---
    let speedBonus = 0;
    let integrityBonus = 0;

    // Speed Bonus: 20% extra if finished in under 50% of the time limit
    const timeUsedPercent = timeTaken / quiz.timeLimit;
    if (timeUsedPercent <= 0.5 && percentage >= 0.5) {
      speedBonus = Math.round(baseXP * 0.2);
    }

    // Integrity Bonus: 10% extra if zero violations and not terminated
    if (violations === 0 && !terminatedBySystem) {
      integrityBonus = Math.round(baseXP * 0.1);
    }

    let xpEarned = baseXP + speedBonus + integrityBonus;

    // Penalty: Reduce XP if quiz was terminated due to violations
    if (terminatedBySystem) {
      xpEarned = Math.round(baseXP * 0.5); // 50% XP penalty (no bonuses)
      speedBonus = 0;
      integrityBonus = 0;
    }

    // Check for previous best attempt (for XP delta calculation)
    const previousBest = await Result.findOne({
      studentId: req.user.id,
      quizId: quiz._id
    }).sort({ xpEarned: -1 }); // Get highest XP attempt

    let xpToAward = xpEarned;
    let isReattempt = false;

    if (previousBest) {
      isReattempt = true;
      // Only award the difference if new score is higher
      if (xpEarned > previousBest.xpEarned) {
        xpToAward = xpEarned - previousBest.xpEarned;
      } else {
        xpToAward = 0; // No additional XP if score isn't better
      }
    }

    // Save the Result
    const newResult = new Result({
      studentId: req.user.id,
      quizId: quiz._id,
      score: percentage * 100,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      wrongAnswers: quiz.questions.length - correctCount,
      answers, // Store student's answer selections
      xpEarned,
      timeTaken,
      violations,
      terminatedBySystem,
    });
    await newResult.save();

    // Update Student Profile (Add XP to their permanent record)
    if (xpToAward > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalXP: xpToAward }
      });
    }

    res.json({
      message: "Quiz Submitted!",
      resultId: newResult._id,
      score: percentage * 100,
      xpEarned,
      xpAwarded: xpToAward, // Actual XP added to profile (may differ on re-attempts)
      isReattempt,
      correctCount,
      totalQuestions: quiz.questions.length,
      questionDetails,
      // Bonus breakdown for UI
      bonuses: {
        baseXP,
        speedBonus,
        integrityBonus,
        penaltyApplied: terminatedBySystem
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. STUDENT: Get Previous Quiz Result
export const getQuizResult = async (req, res) => {
  try {
    const { id } = req.params; // quizId

    // Get the latest result for this student + quiz
    const result = await Result.findOne({
      studentId: req.user.id,
      quizId: id
    }).sort({ completedAt: -1 });

    if (!result) {
      return res.json({ attempted: false });
    }

    // Also fetch the quiz to build question details if we have answers stored
    const quiz = await Quiz.findById(id);
    let questionDetails = [];

    if (quiz && result.answers && result.answers.length > 0) {
      questionDetails = quiz.questions.map((q, i) => ({
        questionText: q.questionText,
        options: q.options,
        studentAnswerIndex: result.answers[i] !== undefined ? result.answers[i] : null,
        correctAnswerIndex: q.correctOptionIndex,
        isCorrect: result.answers[i] === q.correctOptionIndex
      }));
    }

    // Get best score across all attempts
    const bestResult = await Result.findOne({
      studentId: req.user.id,
      quizId: id
    }).sort({ score: -1 });

    // Get attempt count
    const attemptCount = await Result.countDocuments({
      studentId: req.user.id,
      quizId: id
    });

    res.json({
      attempted: true,
      result: {
        _id: result._id,
        score: result.score,
        xpEarned: result.xpEarned,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        totalQuestions: result.totalQuestions,
        timeTaken: result.timeTaken,
        violations: result.violations,
        terminatedBySystem: result.terminatedBySystem,
        completedAt: result.completedAt,
        aiSummary: result.aiSummary,
        aiSummaryGeneratedAt: result.aiSummaryGeneratedAt,
        questionDetails
      },
      bestScore: bestResult?.score || 0,
      bestXp: bestResult?.xpEarned || 0,
      attemptCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. STUDENT: Generate AI Summary for a Quiz Result (Credit-gated)
export const generateAISummary = async (req, res) => {
  try {
    const { id } = req.params; // quizId

    // Get the latest result
    const result = await Result.findOne({
      studentId: req.user.id,
      quizId: id
    }).sort({ completedAt: -1 });

    if (!result) {
      return res.status(404).json({ message: "No quiz result found. Take the quiz first." });
    }

    // If AI summary already exists for this result, return it (FREE — no credit needed)
    if (result.aiSummary) {
      return res.json({
        summary: result.aiSummary,
        generatedAt: result.aiSummaryGeneratedAt,
        cached: true
      });
    }

    // ── Credit Check ──
    const user = await User.findById(req.user.id);
    resetDailyCredits(user);

    if (!deductCredit(user, 'summary')) {
      await user.save();
      return res.status(403).json({
        error: 'No AI credits remaining! Purchase more from the Credit Center.',
        creditsNeeded: true,
        credits: {
          summary: user.aiCredits.summary,
          chatbot: user.aiCredits.chatbot,
          purchased: user.aiCredits.purchased,
        },
      });
    }
    await user.save();

    // Fetch full quiz data (with correct answers) for the AI prompt
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    // Generate AI summary
    let summary;
    try {
      summary = await generateQuizSummary(quiz, result);
    } catch (aiErr) {
      // Refund credit on AI failure
      if (user.aiCredits.summary < 10) {
        user.aiCredits.summary += 1;
      } else {
        user.aiCredits.purchased += 1;
      }
      await user.save();
      throw aiErr;
    }

    // Save to database
    result.aiSummary = summary;
    result.aiSummaryGeneratedAt = new Date();
    await result.save();

    res.json({
      summary,
      generatedAt: result.aiSummaryGeneratedAt,
      cached: false,
      credits: {
        summary: user.aiCredits.summary,
        chatbot: user.aiCredits.chatbot,
        purchased: user.aiCredits.purchased,
      },
    });
  } catch (err) {
    console.error('AI Summary Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// 7. STUDENT: Get results for multiple quizzes (batch — for lobby badges)
export const getMyResults = async (req, res) => {
  try {
    // Get the best result for each quiz this student has attempted
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const results = await Result.aggregate([
      { $match: { studentId: userId } },
      { $sort: { score: -1 } },
      {
        $group: {
          _id: '$quizId',
          bestScore: { $first: '$score' },
          bestXp: { $first: '$xpEarned' },
          attemptCount: { $sum: 1 },
          lastAttempt: { $first: '$completedAt' }
        }
      }
    ]);

    // Convert to a simple map: quizId -> { bestScore, bestXp, attemptCount }
    const resultsMap = {};
    results.forEach(r => {
      resultsMap[r._id.toString()] = {
        bestScore: r.bestScore,
        bestXp: r.bestXp,
        attemptCount: r.attemptCount,
        lastAttempt: r.lastAttempt
      };
    });

    res.json(resultsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};