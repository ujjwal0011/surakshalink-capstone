import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useGameLoop } from '../../../features/gamification/hooks/useGameLoop';
import { useSecureQuiz } from '../../../features/gamification/hooks/useSecureQuiz';
import GameCanvas from '../../../features/gamification/components/GameCanvas';

const PlayQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const violationsRef = useRef(0);

  // Fetch Quiz Data
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const { data } = await api.get(`/quiz/${id}`);
        setQuizData(data);
      } catch (error) {
        console.error("Failed to load quiz");
        navigate('/dashboard/student');
      }
    };
    loadQuiz();
  }, [id, navigate]);

  // Init Game Engine
  const game = useGameLoop(id, quizData);

  // Force end callback — uses ref to avoid stale closure
  const handleMaxViolations = useCallback(() => {
    game.forceEndGame(violationsRef.current);
  }, [game.forceEndGame]);

  // Init Security Engine (active only during PLAYING)
  const secure = useSecureQuiz(
    game.gameState === 'PLAYING',
    handleMaxViolations
  );

  // Keep ref in sync with secure.violations
  useEffect(() => {
    violationsRef.current = secure.violations;
  }, [secure.violations]);

  // Handle starting the quiz (from instructions screen)
  const handleStartQuiz = async () => {
    await secure.enterFullscreen();
    game.startQuiz();
  };

  // Cleanup fullscreen on unmount or finish
  useEffect(() => {
    if (game.gameState === 'FINISHED') {
      secure.exitSecureMode();
    }
    return () => secure.exitSecureMode();
  }, [game.gameState]);

  // --- LOADING ---
  if (!quizData || game.gameState === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">
        LOADING MISSION DATA...
      </div>
    );
  }

  // --- INSTRUCTIONS SCREEN ---
  if (game.gameState === 'INSTRUCTIONS') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white text-center">
              <div className="text-4xl mb-2">🛡️</div>
              <h1 className="text-2xl font-black tracking-tight">SECURE EXAM MODE</h1>
              <p className="text-red-100 text-sm mt-1">Read all instructions carefully before starting</p>
            </div>

            {/* Quiz Info */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{quizData.title}</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 rounded-xl p-3">
                  <span className="block text-2xl font-black text-blue-600">{quizData.questions.length}</span>
                  <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Questions</span>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <span className="block text-2xl font-black text-green-600">{quizData.timeLimit}s</span>
                  <span className="text-xs text-green-400 font-bold uppercase tracking-wider">Time Limit</span>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                  <span className="block text-2xl font-black text-yellow-600">{quizData.xpReward}</span>
                  <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">XP Reward</span>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="p-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">📋 Exam Rules</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-black">1</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Full-Screen Mode Required</strong> — The quiz will enter full-screen. Exiting full-screen counts as a violation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-black">2</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">No Tab Switching</strong> — Switching to another tab or application will be detected and counted as a violation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-black">3</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Copy/Paste Disabled</strong> — All copy, paste, cut, right-click, and keyboard shortcuts are blocked.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-black">4</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Maximum 3 Violations</strong> — After 3 violations, your quiz will be <strong>automatically submitted</strong> with your current answers.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-black">5</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Timer is Final</strong> — Once the timer runs out, your quiz auto-submits. No extensions.
                  </span>
                </li>
              </ul>
            </div>

            {/* Warning Box */}
            <div className="mx-6 mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <span className="font-bold text-yellow-800 text-sm">Important</span>
              </div>
              <p className="text-yellow-700 text-xs leading-relaxed">
                All violations are recorded and visible to your teacher. Make sure you're in a quiet environment with no distractions before starting. Close all unnecessary tabs and applications.
              </p>
            </div>

            {/* Start Button */}
            <div className="p-6 pt-0">
              <button
                onClick={handleStartQuiz}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-black text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-200"
              >
                ✅ I Understand — Start Quiz
              </button>
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full mt-3 text-gray-400 py-2 text-sm font-medium hover:text-gray-600 transition-colors"
              >
                ← Go Back to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- GAME OVER SCREEN ---
  if (game.gameState === 'FINISHED') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">{game.terminatedBySystem ? '⛔' : '🎉'}</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {game.terminatedBySystem ? 'QUIZ TERMINATED' : 'MISSION COMPLETE'}
          </h2>
          <p className="text-gray-500 mb-8">
            {game.terminatedBySystem
              ? 'Your quiz was auto-submitted due to too many violations.'
              : 'Your results have been submitted.'}
          </p>

          <div className={`rounded-xl p-6 mb-4 ${game.terminatedBySystem ? 'bg-red-50' : 'bg-blue-50'}`}>
            <span className={`block font-bold text-sm tracking-wider uppercase ${game.terminatedBySystem ? 'text-red-600' : 'text-blue-600'}`}>
              Your Score
            </span>
            <span className={`block text-5xl font-black mt-2 ${game.terminatedBySystem ? 'text-red-700' : 'text-blue-700'}`}>
              {game.score}%
            </span>
          </div>

          {/* Violation Summary */}
          {secure.violations > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-600">⚠️</span>
                <span className="font-bold text-yellow-800 text-sm">Violations Recorded: {secure.violations}</span>
              </div>
              <p className="text-yellow-600 text-xs">
                Tab switches, fullscreen exits, and other infractions are reported to your teacher.
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard/student')}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform"
          >
            RETURN TO BASE
          </button>
        </div>
      </div>
    );
  }

  // --- PLAYING SCREEN ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" style={{ userSelect: 'none' }}>
      <GameCanvas
        question={game.currentQuestion}
        timeLeft={game.timeLeft}
        totalTime={quizData.timeLimit}
        onAnswer={game.handleAnswer}
        currentQIndex={game.currentQuestionIndex}
        totalQ={game.totalQuestions}
        violations={secure.violations}
        maxViolations={secure.maxViolations}
      />
    </div>
  );
};

export default PlayQuiz;