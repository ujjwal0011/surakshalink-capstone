import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useGameLoop } from '../../../features/gamification/hooks/useGameLoop';
import { useSecureQuiz } from '../../../features/gamification/hooks/useSecureQuiz';
import { useQuizPersistence } from '../../../features/gamification/hooks/useQuizPersistence';
import GameCanvas from '../../../features/gamification/components/GameCanvas';

const PlayQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const violationsRef = useRef(0);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiCreditsNeeded, setAiCreditsNeeded] = useState(false);
  const [aiCredits, setAiCredits] = useState(null);
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);

  // Resume dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Fetch AI credits on mount
  useEffect(() => {
    api.get('/ai/credits').then(({ data }) => {
      setAiCredits({ summary: data.summary, chatbot: data.chatbot, purchased: data.purchased });
    }).catch(() => {});
  }, []);

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

  // Init Persistence Engine
  const persistence = useQuizPersistence(id);

  // Init Game Engine (pass persistence)
  const game = useGameLoop(id, quizData, persistence);

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

  // Show resume dialog when saved progress is found (on INSTRUCTIONS state)
  useEffect(() => {
    if (
      persistence.hasSavedProgress &&
      (game.gameState === 'INSTRUCTIONS' || game.gameState === 'PREVIOUS_ATTEMPT')
    ) {
      setShowResumeDialog(true);
    }
  }, [persistence.hasSavedProgress, game.gameState]);

  // Handle starting the quiz (from instructions screen)
  const handleStartQuiz = async () => {
    await secure.enterFullscreen();
    persistence.dismissSavedProgress();
    game.startQuiz();
  };

  // Handle resuming quiz from saved progress
  const handleResumeQuiz = async () => {
    const saved = persistence.loadProgress();
    if (saved) {
      await secure.enterFullscreen();
      game.resumeQuiz(saved);
      setShowResumeDialog(false);
    }
  };

  // Handle starting fresh (dismiss saved progress)
  const handleStartFresh = async () => {
    persistence.dismissSavedProgress();
    setShowResumeDialog(false);
  };

  // Cleanup fullscreen on unmount or finish
  useEffect(() => {
    if (game.gameState === 'FINISHED') {
      secure.exitSecureMode();
    }
    return () => secure.exitSecureMode();
  }, [game.gameState]);

  // Load cached AI summary if previous result has one
  useEffect(() => {
    if (game.previousResult?.result?.aiSummary) {
      setAiSummary(game.previousResult.result.aiSummary);
    }
  }, [game.previousResult]);

  // Generate AI Summary (credit-gated)
  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiCreditsNeeded(false);
    try {
      const { data } = await api.post(`/quiz/${id}/ai-summary`);
      setAiSummary(data.summary);
      if (data.credits) setAiCredits(data.credits);
    } catch (error) {
      if (error.response?.data?.creditsNeeded) {
        setAiCreditsNeeded(true);
        if (error.response.data.credits) setAiCredits(error.response.data.credits);
      }
      setAiError(error.response?.data?.error || 'Failed to generate AI summary. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // --- LOADING ---
  if (!quizData || game.gameState === 'LOADING') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-gray-400 tracking-widest uppercase">Loading Mission Data...</p>
        </div>
      </div>
    );
  }

  // --- PREVIOUS ATTEMPT SCREEN ---
  if (game.gameState === 'PREVIOUS_ATTEMPT' && game.previousResult) {
    const prev = game.previousResult;
    const result = prev.result;
    const scoreColor = result.score >= 80 ? 'green' : result.score >= 50 ? 'yellow' : 'red';

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {/* Resume Dialog Overlay */}
        {showResumeDialog && (
          <ResumeDialog
            savedProgress={persistence.savedProgress}
            onResume={handleResumeQuiz}
            onStartFresh={handleStartFresh}
          />
        )}

        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
              <div className="text-4xl mb-3">📊</div>
              <h1 className="text-2xl font-bold">{quizData.title}</h1>
              <p className="text-indigo-200 text-sm mt-2">You've attempted this quiz before</p>
            </div>

            {/* Previous Attempt Stats */}
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Previous Attempt Results</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className={`bg-${scoreColor}-50 rounded-2xl p-4 text-center`} style={{
                  backgroundColor: scoreColor === 'green' ? '#f0fdf4' : scoreColor === 'yellow' ? '#fefce8' : '#fef2f2'
                }}>
                  <span className="block text-3xl font-black" style={{
                    color: scoreColor === 'green' ? '#16a34a' : scoreColor === 'yellow' ? '#ca8a04' : '#dc2626'
                  }}>{Math.round(result.score)}%</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Score</span>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <span className="block text-3xl font-black text-blue-600">{result.xpEarned}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">XP Earned</span>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <span className="block text-3xl font-black text-purple-600">{prev.attemptCount}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Attempts</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <span className="block text-3xl font-black text-gray-600">{result.correctAnswers}/{result.totalQuestions}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Correct</span>
                </div>
              </div>

              {/* Best Score Banner */}
              {prev.attemptCount > 1 && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <span className="font-bold text-yellow-800 text-sm">Best Score: {Math.round(prev.bestScore)}%</span>
                    <span className="text-yellow-600 text-xs ml-2">({prev.bestXp} XP)</span>
                  </div>
                </div>
              )}

              {/* Completed At */}
              <div className="text-center text-gray-400 text-xs mb-8">
                Last attempted on {new Date(result.completedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>

              {/* AI Summary Section (if cached) */}
              {aiSummary && (
                <AISummaryCard summary={aiSummary} />
              )}

              {/* Question Details Toggle */}
              {result.questionDetails && result.questionDetails.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowQuestionDetails(!showQuestionDetails)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-200 transition-all duration-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-gray-700 flex items-center gap-2">
                      📋 Question Breakdown
                    </span>
                    <span className="text-gray-400 text-xl">{showQuestionDetails ? '−' : '+'}</span>
                  </button>
                  {showQuestionDetails && (
                    <QuestionBreakdown questions={result.questionDetails} />
                  )}
                </div>
              )}

              {/* Generate AI Summary Button (if not cached) */}
              {!aiSummary && (
                <button
                  onClick={handleGenerateAISummary}
                  disabled={aiLoading || aiCreditsNeeded}
                  className="w-full mb-4 bg-blue-600 text-white py-3.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {aiLoading ? (
                    <>
                      <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      ✨ Summarize with AI
                      {aiCredits && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full ml-1">
                          {aiCredits.summary + aiCredits.purchased} left
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}

              {aiCreditsNeeded ? (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-700 font-bold mb-1">⚡ Out of AI Credits</p>
                  <p className="text-red-600 text-xs mb-3">You need summary credits to use this feature.</p>
                  <Link to="/dashboard/student/ai" className="inline-block bg-red-100 text-red-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-200 transition">
                    Visit Credit Center
                  </Link>
                </div>
              ) : aiError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                  {aiError}
                </div>
              )}

              {/* Action Buttons */}
              <button
                onClick={() => game.setGameState('INSTRUCTIONS')}
                className="w-full bg-green-600 text-white py-3.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                🔄 Attempt Again
              </button>
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full mt-3 text-gray-400 py-2 text-sm font-medium hover:text-gray-600 transition-colors"
              >
                ← Back to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- INSTRUCTIONS SCREEN ---
  if (game.gameState === 'INSTRUCTIONS') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {/* Resume Dialog Overlay */}
        {showResumeDialog && (
          <ResumeDialog
            savedProgress={persistence.savedProgress}
            onResume={handleResumeQuiz}
            onStartFresh={handleStartFresh}
          />
        )}

        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-red-600 p-6 text-white text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h1 className="text-2xl font-bold">SECURE EXAM MODE</h1>
              <p className="text-red-100 text-sm mt-1">Read all instructions carefully before starting</p>
            </div>

            {/* Re-attempt Notice */}
            {game.previousResult && (
              <div className="mx-6 mt-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-600 text-lg">🔄</span>
                  <span className="font-bold text-indigo-800 text-sm">Re-attempt Mode</span>
                </div>
                <p className="text-indigo-600 text-xs leading-relaxed">
                  Your previous best: <strong>{Math.round(game.previousResult.bestScore)}%</strong> ({game.previousResult.bestXp} XP).
                  Additional XP will only be awarded if you score higher.
                </p>
              </div>
            )}

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
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">📋 Exam Rules</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Full-Screen Mode Required</strong> — The quiz will enter full-screen. Exiting full-screen counts as a violation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">No Tab Switching</strong> — Switching to another tab or application will be detected and counted as a violation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Copy/Paste Disabled</strong> — All copy, paste, cut, right-click, and keyboard shortcuts are blocked.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Maximum 3 Violations</strong> — After 3 violations, your quiz will be <strong>automatically submitted</strong> with your current answers.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Timer is Final</strong> — Once the timer runs out, your quiz auto-submits. No extensions.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">6</span>
                  <span className="text-gray-700 text-sm">
                    <strong className="text-gray-900">Navigate Freely</strong> — Use Next, Previous buttons or the question palette to move between questions. Bookmark questions for review.
                  </span>
                </li>
              </ul>
            </div>

            {/* Warning Box */}
            <div className="mx-6 mb-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <span className="font-bold text-yellow-800 text-sm">Important</span>
              </div>
              <p className="text-yellow-700 text-xs leading-relaxed">
                All violations are recorded and visible to your teacher. Make sure you're in a quiet environment with no distractions before starting. Close all unnecessary tabs and applications.
              </p>
            </div>

            {/* Offline Resilience Notice */}
            <div className="mx-6 mb-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-600 text-lg">📡</span>
                <span className="font-bold text-blue-800 text-sm">Offline Protected</span>
              </div>
              <p className="text-blue-700 text-xs leading-relaxed">
                Your progress is automatically saved locally. If you lose internet, the timer will pause and your answers are safe. They'll be submitted when you're back online.
              </p>
            </div>

            {/* XP Bonus Tips */}
              <div className="mx-6 mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-600 text-lg">⚡</span>
                <span className="font-bold text-emerald-800 text-sm">Earn Bonus XP!</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-emerald-700 text-xs flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                  <strong>Speed Bonus (+20%):</strong> Finish in under half the time limit with ≥50% score
                </p>
                <p className="text-emerald-700 text-xs flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-purple-500 rounded-full flex-shrink-0"></span>
                  <strong>Integrity Bonus (+10%):</strong> Complete with zero violations
                </p>
              </div>
            </div>

            {/* Start Button */}
            <div className="p-6 pt-0">
              <button
                onClick={handleStartQuiz}
                className="w-full bg-green-600 text-white py-3.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
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
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`p-8 text-center ${game.terminatedBySystem 
              ? 'bg-red-600' 
              : 'bg-emerald-600'}`}
            >
              <div className="text-6xl mb-4">{game.terminatedBySystem ? '⛔' : '🎉'}</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {game.terminatedBySystem ? 'QUIZ TERMINATED' : 'MISSION COMPLETE'}
              </h2>
              <p className="text-white/80">
                {game.terminatedBySystem
                  ? 'Your quiz was auto-submitted due to too many violations.'
                  : 'Your results have been submitted.'}
              </p>
            </div>

            <div className="p-8">
              {/* Score & XP Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`rounded-2xl p-6 text-center ${game.terminatedBySystem ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <span className={`block font-bold text-sm tracking-wider uppercase ${game.terminatedBySystem ? 'text-red-600' : 'text-blue-600'}`}>
                    Your Score
                  </span>
                  <span className={`block text-5xl font-black mt-2 ${game.terminatedBySystem ? 'text-red-700' : 'text-blue-700'}`}>
                    {Math.round(game.score)}%
                  </span>
                </div>
                <div className="bg-yellow-50 rounded-2xl p-6 text-center">
                  <span className="block font-bold text-sm tracking-wider uppercase text-yellow-600">
                    XP Earned
                  </span>
                  <span className="block text-5xl font-black mt-2 text-yellow-700">
                    {game.xpEarned}
                  </span>
                  {game.isReattempt && (
                    <span className="block text-xs text-yellow-500 mt-1">
                      +{game.xpAwarded} XP added to profile
                    </span>
                  )}
                </div>
              </div>

              {/* XP Bonus Breakdown */}
              {game.bonuses && (
                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5 mb-6">
                  <h3 className="font-bold text-sm text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    ⚡ XP Breakdown
                  </h3>
                  <div className="space-y-3">
                    {/* Base XP */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        Base XP
                      </span>
                      <span className="font-bold text-gray-800">+{game.bonuses.baseXP}</span>
                    </div>
                    {/* Speed Bonus */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        Speed Bonus
                        <span className="text-[10px] text-gray-400">(Finish &lt;50% time)</span>
                      </span>
                      <span className={`font-bold ${game.bonuses.speedBonus > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                        {game.bonuses.speedBonus > 0 ? `+${game.bonuses.speedBonus}` : '—'}
                      </span>
                    </div>
                    {/* Integrity Bonus */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="h-2 w-2 bg-purple-500 rounded-full"></span>
                        Integrity Bonus
                        <span className="text-[10px] text-gray-400">(0 violations)</span>
                      </span>
                      <span className={`font-bold ${game.bonuses.integrityBonus > 0 ? 'text-purple-600' : 'text-gray-300'}`}>
                        {game.bonuses.integrityBonus > 0 ? `+${game.bonuses.integrityBonus}` : '—'}
                      </span>
                    </div>
                    {/* Penalty */}
                    {game.bonuses.penaltyApplied && (
                      <div className="flex items-center justify-between border-t border-red-100 pt-3">
                        <span className="text-sm text-red-600 flex items-center gap-2 font-bold">
                          <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                          Violation Penalty (50%)
                        </span>
                        <span className="font-bold text-red-600">Applied</span>
                      </div>
                    )}
                    {/* Total */}
                    <div className="flex items-center justify-between border-t border-indigo-200 pt-3 mt-1">
                      <span className="text-sm font-bold text-indigo-800">Total XP</span>
                      <span className="font-black text-lg text-indigo-700">{game.xpEarned}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Re-attempt Badge */}
              {game.isReattempt && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <span className="text-xl">🔄</span>
                  <div>
                    <span className="font-bold text-indigo-800 text-sm">Re-attempt</span>
                    <p className="text-indigo-600 text-xs">
                      {game.xpAwarded > 0
                        ? `You improved! +${game.xpAwarded} additional XP awarded.`
                        : `Score this attempt: ${Math.round(game.score)}%. No additional XP (didn't beat your best).`}
                    </p>
                  </div>
                </div>
              )}

              {/* Violation Summary */}
              {secure.violations > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="font-bold text-yellow-800 text-sm">Violations Recorded: {secure.violations}</span>
                  </div>
                  <p className="text-yellow-600 text-xs">
                    Tab switches, fullscreen exits, and other infractions are reported to your teacher.
                  </p>
                </div>
              )}

              {/* Question Details Toggle */}
              {game.questionDetails.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowQuestionDetails(!showQuestionDetails)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-gray-700 flex items-center gap-2">
                      📋 View Question Breakdown ({game.questionDetails.filter(q => q.isCorrect).length}/{game.questionDetails.length} correct)
                    </span>
                    <span className="text-gray-400 text-xl">{showQuestionDetails ? '−' : '+'}</span>
                  </button>
                  {showQuestionDetails && (
                    <QuestionBreakdown questions={game.questionDetails} />
                  )}
                </div>
              )}

              {/* AI Summary Section */}
              {aiSummary ? (
                <AISummaryCard summary={aiSummary} />
              ) : (
                <button
                  onClick={handleGenerateAISummary}
                  disabled={aiLoading || aiCreditsNeeded}
                  className="w-full mb-4 bg-blue-600 text-white py-3.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {aiLoading ? (
                    <>
                      <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      ✨ Summarize with AI
                      {aiCredits && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full ml-1">
                          {aiCredits.summary + aiCredits.purchased} left
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}

              {aiCreditsNeeded ? (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-700 font-bold mb-1">⚡ Out of AI Credits</p>
                  <p className="text-red-600 text-xs mb-3">You need summary credits to use this feature.</p>
                  <Link to="/dashboard/student/ai" className="inline-block bg-red-100 text-red-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-200 transition">
                    Visit Credit Center
                  </Link>
                </div>
              ) : aiError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                  {aiError}
                </div>
              )}

              {/* Return Button */}
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform"
              >
                RETURN TO BASE
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING SCREEN ---
  return (
    <GameCanvas
      question={game.currentQuestion}
      timeLeft={game.timeLeft}
      totalTime={quizData.timeLimit}
      currentQIndex={game.currentQuestionIndex}
      totalQ={game.totalQuestions}
      violations={secure.violations}
      maxViolations={secure.maxViolations}
      answers={game.answers}
      bookmarkedQuestions={game.bookmarkedQuestions}
      isOnline={persistence.isOnline}
      timerPaused={game.timerPaused}

      // Navigation handlers
      onSelectAnswer={game.selectAnswer}
      onClearAnswer={game.clearAnswer}
      onGoToQuestion={game.goToQuestion}
      onGoToNext={game.goToNext}
      onGoToPrev={game.goToPrev}
      onToggleBookmark={game.toggleBookmark}
      onMarkAndNext={game.markAndNext}
      onSaveAndNext={game.saveAndNext}
      onSubmitQuiz={game.submitQuiz}
      getQuestionStatus={game.getQuestionStatus}
      stats={game.stats}
    />
  );
};

// ===== SUB-COMPONENTS =====

// Resume Quiz Dialog
const ResumeDialog = ({ savedProgress, onResume, onStartFresh }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-600 p-6 text-white text-center">
        <div className="text-3xl mb-2">💾</div>
        <h3 className="text-xl font-bold">Resume Quiz?</h3>
        <p className="text-blue-200 text-sm mt-1">You have unsaved progress</p>
      </div>
      <div className="p-6">
        {savedProgress && (
          <div className="bg-blue-50 rounded-xl p-4 mb-5 border border-blue-100">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-bold text-blue-700">
                  {savedProgress.answers?.filter(a => a !== null && a !== undefined).length || 0} / {savedProgress.answers?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="font-bold text-blue-700">
                  {Math.floor((savedProgress.timeLeft || 0) / 60)}:{String((savedProgress.timeLeft || 0) % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Saved At:</span>
                <span className="font-bold text-gray-500 text-xs">
                  {new Date(savedProgress.savedAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onStartFresh}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all"
          >
            🗑️ Start Fresh
          </button>
          <button
            onClick={onResume}
            className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            ▶️ Resume Quiz
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Question Breakdown Component
const QuestionBreakdown = ({ questions }) => (
  <div className="mt-3 space-y-3">
    {questions.map((q, i) => (
      <div
        key={i}
        className={`p-4 rounded-xl border-2 transition-all ${
          q.isCorrect
            ? 'border-green-100 bg-green-50/50'
            : 'border-red-100 bg-red-50/50'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-sm font-black ${
            q.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {q.isCorrect ? '✓' : '✗'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm mb-2">
              Q{i + 1}: {q.questionText}
            </p>
            <div className="space-y-1">
              {q.options.map((opt, optIdx) => {
                const isStudentAnswer = optIdx === q.studentAnswerIndex;
                const isCorrectAnswer = optIdx === q.correctAnswerIndex;

                let style = 'text-gray-500 text-xs';
                let icon = '';
                if (isCorrectAnswer) {
                  style = 'text-green-700 font-bold text-xs bg-green-100 px-2 py-1 rounded-lg';
                  icon = '✅ ';
                } else if (isStudentAnswer && !q.isCorrect) {
                  style = 'text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-lg line-through';
                  icon = '❌ ';
                }

                return (
                  <div key={optIdx} className={style}>
                    {icon}{String.fromCharCode(65 + optIdx)}) {opt}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// AI Summary Card Component
const AISummaryCard = ({ summary }) => (
  <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
    {/* Header */}
    <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
      <span className="text-2xl">🤖</span>
      <div>
        <h3 className="text-white font-bold text-lg">AI Performance Analysis</h3>
        <p className="text-blue-200 text-xs">Powered by Google Gemini</p>
      </div>
    </div>

    <div className="p-6 space-y-5">
      {/* Overall Assessment */}
      <div>
        <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
          📝 Overall Assessment
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed bg-white rounded-lg p-4">
          {summary.overallAssessment}
        </p>
      </div>

      {/* Strong & Weak Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summary.strongTopics && summary.strongTopics.length > 0 && (
          <div className="bg-green-50/80 rounded-xl p-4 border border-green-100">
            <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2">
              💪 Strong Areas
            </h4>
            <ul className="space-y-1">
              {summary.strongTopics.map((topic, i) => (
                <li key={i} className="text-green-700 text-xs flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}
        {summary.weakTopics && summary.weakTopics.length > 0 && (
          <div className="bg-red-50/80 rounded-xl p-4 border border-red-100">
            <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
              📚 Topics to Focus On
            </h4>
            <ul className="space-y-1">
              {summary.weakTopics.map((topic, i) => (
                <li key={i} className="text-red-700 text-xs flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Wrong Answer Analysis */}
      {summary.wrongAnswerAnalysis && summary.wrongAnswerAnalysis.length > 0 && (
        <div>
          <h4 className="font-bold text-purple-800 text-sm mb-3 flex items-center gap-2">
            🔍 Wrong Answer Analysis
          </h4>
          <div className="space-y-3">
            {summary.wrongAnswerAnalysis.map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                    Q{item.questionNumber}
                  </span>
                  <span className="text-purple-600 text-xs font-medium">{item.topic}</span>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {summary.recommendations && summary.recommendations.length > 0 && (
        <div>
          <h4 className="font-bold text-purple-800 text-sm mb-2 flex items-center gap-2">
            💡 Recommendations
          </h4>
          <ul className="space-y-2">
            {summary.recommendations.map((rec, i) => (
              <li key={i} className="text-gray-700 text-xs flex items-start gap-2 bg-white/60 rounded-lg p-3">
                <span className="text-purple-500 font-bold">{i + 1}.</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Encouragement */}
      {summary.encouragement && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
          <span className="text-2xl mb-2 block">🌟</span>
          <p className="text-amber-800 text-sm font-medium italic">{summary.encouragement}</p>
        </div>
      )}

      {/* Fallback notice */}
      {summary._fallback && (
        <p className="text-gray-400 text-xs text-center italic">
          AI service unavailable. Showing basic summary.
        </p>
      )}
    </div>
  </div>
);

export default PlayQuiz;