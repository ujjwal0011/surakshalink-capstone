import Quiz from '../models/quiz.model.js';
import Result from '../models/result.model.js';
import User from '../models/user.model.js';

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

    // Grade the quiz securely on the server
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctOptionIndex) {
        correctCount++;
      }
    });

    // Calculate XP (Gamification Logic)
    const percentage = correctCount / quiz.questions.length;
    let xpEarned = Math.round(percentage * quiz.xpReward);

    // Penalty: Reduce XP if quiz was terminated due to violations
    if (terminatedBySystem) {
      xpEarned = Math.round(xpEarned * 0.5); // 50% XP penalty
    }

    // Save the Result
    const newResult = new Result({
      studentId: req.user.id,
      quizId: quiz._id,
      score: percentage * 100,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      wrongAnswers: quiz.questions.length - correctCount,
      xpEarned,
      timeTaken,
      violations,
      terminatedBySystem,
    });
    await newResult.save();

    // Update Student Profile (Add XP to their permanent record)
    // Note: Ensure your User model has a 'totalXP' field (default: 0)
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalXP: xpEarned }
    });

    res.json({
      message: "Quiz Submitted!",
      score: percentage * 100,
      xpEarned,
      correctCount,
      totalQuestions: quiz.questions.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};