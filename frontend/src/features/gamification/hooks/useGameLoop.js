import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export const useGameLoop = (quizId, quizData, persistence) => {
  const navigate = useNavigate();

  // Game State: LOADING → INSTRUCTIONS (or PREVIOUS_ATTEMPT) → PLAYING → FINISHED
  const [gameState, setGameState] = useState('LOADING');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [terminatedBySystem, setTerminatedBySystem] = useState(false);

  // Non-linear navigation: fixed-size answers array initialized with nulls
  const [answers, setAnswers] = useState([]);
  // Bookmark/mark-for-review system
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());

  // Results state
  const [xpEarned, setXpEarned] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [isReattempt, setIsReattempt] = useState(false);
  const [questionDetails, setQuestionDetails] = useState([]);
  const [resultId, setResultId] = useState(null);
  const [previousResult, setPreviousResult] = useState(null);
  const [bonuses, setBonuses] = useState(null);

  // Timer pause (offline/lenient mode)
  const [timerPaused, setTimerPaused] = useState(false);

  const timerRef = useRef(null);
  const answersRef = useRef([]);
  const violationsRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Pause timer when offline
  useEffect(() => {
    if (persistence) {
      setTimerPaused(!persistence.isOnline);
    }
  }, [persistence?.isOnline]);

  // Initialize Game when data loads — check for previous attempt first
  useEffect(() => {
    if (quizData) {
      setTimeLeft(quizData.timeLimit);
      // Initialize the fixed-size answers array
      setAnswers(Array(quizData.questions.length).fill(null));
      checkPreviousAttempt();
    }
  }, [quizData]);

  // Check if student has previously attempted this quiz
  const checkPreviousAttempt = async () => {
    try {
      const { data } = await api.get(`/quiz/${quizId}/result`);
      if (data.attempted) {
        setPreviousResult(data);
        setGameState('PREVIOUS_ATTEMPT');
      } else {
        setGameState('INSTRUCTIONS');
      }
    } catch (error) {
      // If the check fails, just show instructions
      setGameState('INSTRUCTIONS');
    }
  };

  // Start quiz (called from the Instructions or Previous Attempt screen)
  const startQuiz = useCallback(() => {
    const totalQ = quizData?.questions.length || 0;
    // Reset state for a fresh attempt
    setCurrentQuestionIndex(0);
    setAnswers(Array(totalQ).fill(null));
    setBookmarkedQuestions(new Set());
    setScore(0);
    setXpEarned(0);
    setXpAwarded(0);
    setQuestionDetails([]);
    setResultId(null);
    setTerminatedBySystem(false);
    setBonuses(null);
    setTimeLeft(quizData?.timeLimit || 60);
    setGameState('PLAYING');
  }, [quizData]);

  // Resume quiz from saved progress
  const resumeQuiz = useCallback((savedState) => {
    if (!savedState || !quizData) return;
    const totalQ = quizData.questions.length;

    // Restore answers (pad with nulls if needed)
    const restoredAnswers = Array(totalQ).fill(null);
    if (savedState.answers) {
      savedState.answers.forEach((ans, i) => {
        if (i < totalQ) restoredAnswers[i] = ans;
      });
    }
    setAnswers(restoredAnswers);

    // Restore bookmarks
    setBookmarkedQuestions(new Set(savedState.bookmarks || []));

    // Restore position and timer
    setCurrentQuestionIndex(savedState.currentQuestionIndex || 0);
    setTimeLeft(savedState.timeLeft || quizData.timeLimit);

    // Restore violations
    violationsRef.current = savedState.violations || 0;

    // Reset results state
    setScore(0);
    setXpEarned(0);
    setXpAwarded(0);
    setQuestionDetails([]);
    setResultId(null);
    setTerminatedBySystem(false);
    setBonuses(null);

    setGameState('PLAYING');
  }, [quizData]);

  // The Timer Loop — respects pause state
  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0 && !timerPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft, timerPaused]);

  const endGame = useCallback((wasForced = false) => {
    clearInterval(timerRef.current);
    if (wasForced) {
      setTerminatedBySystem(true);
    }
    setGameState('FINISHED');
  }, []);

  // Force end game — called by useSecureQuiz when max violations reached
  const forceEndGame = useCallback((violationCount) => {
    clearInterval(timerRef.current);
    setTerminatedBySystem(true);
    setGameState('FINISHED');
    // Submit with whatever answers we have so far
    submitResults(answersRef.current, violationCount, true);
  }, [quizId, quizData]);

  // --- NON-LINEAR NAVIGATION ---

  // Select an answer for a specific question (does NOT advance)
  const selectAnswer = useCallback((questionIndex, optionIndex) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[questionIndex] = optionIndex;
      return updated;
    });
  }, []);

  // Clear an answer for a specific question
  const clearAnswer = useCallback((questionIndex) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[questionIndex] = null;
      return updated;
    });
  }, []);

  // Navigate to a specific question
  const goToQuestion = useCallback((index) => {
    if (quizData && index >= 0 && index < quizData.questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [quizData]);

  // Go to next question
  const goToNext = useCallback(() => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, quizData]);

  // Go to previous question
  const goToPrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // --- BOOKMARK SYSTEM ---

  const toggleBookmark = useCallback((questionIndex) => {
    setBookmarkedQuestions(prev => {
      const updated = new Set(prev);
      if (updated.has(questionIndex)) {
        updated.delete(questionIndex);
      } else {
        updated.add(questionIndex);
      }
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((questionIndex) => {
    return bookmarkedQuestions.has(questionIndex);
  }, [bookmarkedQuestions]);

  // Mark for review AND go to next
  const markAndNext = useCallback(() => {
    setBookmarkedQuestions(prev => {
      const updated = new Set(prev);
      updated.add(currentQuestionIndex);
      return updated;
    });
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, quizData]);

  // Save & Next (select answer + go to next)
  const saveAndNext = useCallback(() => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, quizData]);

  // --- LEGACY: handleAnswer for backward compatibility ---
  const handleAnswer = (optionIndex) => {
    selectAnswer(currentQuestionIndex, optionIndex);
  };

  // --- PERSISTENCE: Auto-save on state changes during PLAYING ---
  useEffect(() => {
    if (gameState === 'PLAYING' && persistence) {
      persistence.saveProgress({
        answers,
        bookmarks: bookmarkedQuestions,
        currentQuestionIndex,
        timeLeft,
        violations: violationsRef.current,
      });
    }
  }, [gameState, answers, bookmarkedQuestions, currentQuestionIndex, timeLeft]);

  // --- STATS HELPERS ---
  const getQuestionStatus = useCallback((index) => {
    const isAnswered = answers[index] !== null && answers[index] !== undefined;
    const isMarked = bookmarkedQuestions.has(index);

    if (isAnswered && isMarked) return 'answered-marked';
    if (isAnswered) return 'answered';
    if (isMarked) return 'marked';
    return 'not-answered';
  }, [answers, bookmarkedQuestions]);

  const stats = {
    total: quizData?.questions.length || 0,
    answered: answers.filter(a => a !== null && a !== undefined).length,
    notAnswered: answers.filter(a => a === null || a === undefined).length,
    marked: bookmarkedQuestions.size,
    answeredAndMarked: answers.filter((a, i) => (a !== null && a !== undefined) && bookmarkedQuestions.has(i)).length,
  };

  // --- SUBMISSION ---
  const submitQuiz = useCallback(async (violationCount = 0) => {
    clearInterval(timerRef.current);
    setGameState('FINISHED');

    const result = await submitResults(
      answersRef.current,
      violationCount || violationsRef.current,
      false
    );

    // Clear persistence after successful submit
    if (result && persistence) {
      persistence.clearProgress();
    }

    return result;
  }, [quizId, quizData, persistence]);

  const submitResults = async (finalAnswers, violationCount = 0, wasTerminated = false) => {
    const payload = {
      quizId,
      answers: finalAnswers,
      timeTaken: quizData.timeLimit - timeLeft,
      violations: violationCount,
      terminatedBySystem: wasTerminated,
    };

    try {
      const { data } = await api.post('/quiz/submit', payload);
      setScore(data.score);
      setXpEarned(data.xpEarned);
      setXpAwarded(data.xpAwarded);
      setIsReattempt(data.isReattempt);
      setQuestionDetails(data.questionDetails || []);
      setResultId(data.resultId);
      setBonuses(data.bonuses || null);

      // Clear persistence on success
      if (persistence) {
        persistence.clearProgress();
      }

      return data;
    } catch (error) {
      // If offline, queue the submission
      if (!navigator.onLine && persistence) {
        persistence.queueSubmission(payload);
        toast('Quiz saved! It will be submitted when you are back online.', {
          icon: '📡',
          duration: 6000,
        });
        setScore(0);
        return null;
      }
      toast.error("Failed to submit quiz");
      return null;
    }
  };

  return {
    gameState,
    setGameState,
    currentQuestionIndex,
    currentQuestion: quizData?.questions[currentQuestionIndex],
    timeLeft,
    score,
    streak,
    totalQuestions: quizData?.questions.length || 0,
    terminatedBySystem,
    timerPaused,

    // Navigation
    answers,
    selectAnswer,
    clearAnswer,
    goToQuestion,
    goToNext,
    goToPrev,
    saveAndNext,
    handleAnswer, // Legacy

    // Bookmarks
    bookmarkedQuestions,
    toggleBookmark,
    isBookmarked,
    markAndNext,

    // Stats & status
    getQuestionStatus,
    stats,

    // Game control
    startQuiz,
    resumeQuiz,
    submitQuiz,
    submitResults,
    forceEndGame,
    endGame,

    // Results
    xpEarned,
    xpAwarded,
    isReattempt,
    questionDetails,
    resultId,
    previousResult,
    bonuses,
  };
};