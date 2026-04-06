import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export const useGameLoop = (quizId, quizData) => {
  const navigate = useNavigate();

  // Game State: LOADING → INSTRUCTIONS → PLAYING → FINISHED
  const [gameState, setGameState] = useState('LOADING');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [terminatedBySystem, setTerminatedBySystem] = useState(false);

  const timerRef = useRef(null);
  const answersRef = useRef([]);

  // Keep answersRef in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Initialize Game when data loads → go to INSTRUCTIONS (not PLAYING)
  useEffect(() => {
    if (quizData) {
      setTimeLeft(quizData.timeLimit);
      setGameState('INSTRUCTIONS');
    }
  }, [quizData]);

  // Start quiz (called from the Instructions screen)
  const startQuiz = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  // The Timer Loop
  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
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
  }, [gameState, timeLeft]);

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

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      endGame(false);
      submitResults(newAnswers, 0, false);
    }
  };

  const submitResults = async (finalAnswers, violationCount = 0, wasTerminated = false) => {
    try {
      const payload = {
        quizId,
        answers: finalAnswers,
        timeTaken: quizData.timeLimit - timeLeft,
        violations: violationCount,
        terminatedBySystem: wasTerminated,
      };

      const { data } = await api.post('/quiz/submit', payload);
      setScore(data.score);
      return data;
    } catch (error) {
      toast.error("Failed to submit quiz");
    }
  };

  return {
    gameState,
    currentQuestionIndex,
    currentQuestion: quizData?.questions[currentQuestionIndex],
    timeLeft,
    score,
    streak,
    handleAnswer,
    totalQuestions: quizData?.questions.length || 0,
    submitResults,
    startQuiz,
    forceEndGame,
    terminatedBySystem,
  };
};