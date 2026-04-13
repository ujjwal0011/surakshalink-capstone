import { useState } from 'react';
import TimerBar from './TimerBar';

const GameCanvas = ({
  question,
  timeLeft,
  totalTime,
  currentQIndex,
  totalQ,
  violations = 0,
  maxViolations = 3,
  answers = [],
  bookmarkedQuestions = new Set(),
  isOnline = true,
  timerPaused = false,

  // Navigation handlers
  onSelectAnswer,
  onClearAnswer,
  onGoToQuestion,
  onGoToNext,
  onGoToPrev,
  onToggleBookmark,
  onMarkAndNext,
  onSaveAndNext,
  onSubmitQuiz,
  getQuestionStatus,
  stats = {},
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const selectedAnswer = answers[currentQIndex];
  const isCurrentBookmarked = bookmarkedQuestions.has(currentQIndex);

  // Violation styling
  const isWarning = violations >= 2;
  const isDanger = violations >= maxViolations - 1;

  // Question status colors for palette
  const getStatusColor = (index) => {
    const status = getQuestionStatus?.(index) || 'not-answered';
    const isCurrent = index === currentQIndex;

    const base = {
      'answered': 'bg-emerald-500 text-white border-emerald-600',
      'not-answered': 'bg-red-400 text-white border-red-500',
      'marked': 'bg-violet-500 text-white border-violet-600',
      'answered-marked': 'bg-amber-500 text-white border-amber-600',
    };

    return `${base[status] || base['not-answered']} ${isCurrent ? 'ring-[3px] ring-blue-400 ring-offset-2 scale-110' : ''}`;
  };

  // --- Question Palette Grid ---
  const QuestionPalette = ({ className = '' }) => (
    <div className={className}>
      {/* Palette Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <span className="text-lg">📋</span>
        <h3 className="font-black text-sm text-gray-700 uppercase tracking-widest">Question Palette</h3>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {Array.from({ length: totalQ }, (_, i) => (
          <button
            key={i}
            onClick={() => onGoToQuestion(i)}
            className={`relative h-10 w-full rounded-lg border-2 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${getStatusColor(i)}`}
            title={`Question ${i + 1}`}
          >
            {i + 1}
            {bookmarkedQuestions.has(i) && (
              <span className="absolute -top-1 -right-1 text-[10px]">🔖</span>
            )}
          </button>
        ))}
      </div>

      {/* Color Legend */}
      <div className="space-y-2 mb-5 p-3 bg-gray-50 rounded-xl">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Legend</p>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-emerald-500 border border-emerald-600 flex-shrink-0"></span>
          <span className="text-xs text-gray-600 font-medium">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-red-400 border border-red-500 flex-shrink-0"></span>
          <span className="text-xs text-gray-600 font-medium">Not Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-violet-500 border border-violet-600 flex-shrink-0"></span>
          <span className="text-xs text-gray-600 font-medium">Marked for Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-amber-500 border border-amber-600 flex-shrink-0"></span>
          <span className="text-xs text-gray-600 font-medium">Answered & Marked</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
          <span className="block text-lg font-black text-emerald-600">{stats.answered || 0}</span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Answered</span>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
          <span className="block text-lg font-black text-red-500">{stats.notAnswered || 0}</span>
          <span className="text-[10px] font-bold text-red-400 uppercase">Unanswered</span>
        </div>
        <div className="bg-violet-50 rounded-lg p-2 text-center border border-violet-100">
          <span className="block text-lg font-black text-violet-600">{stats.marked || 0}</span>
          <span className="text-[10px] font-bold text-violet-400 uppercase">Marked</span>
        </div>
        <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
          <span className="block text-lg font-black text-amber-600">{stats.answeredAndMarked || 0}</span>
          <span className="text-[10px] font-bold text-amber-400 uppercase">Ans & Marked</span>
        </div>
      </div>

      {/* Submit Button in Palette */}
      <button
        onClick={() => setShowSubmitModal(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-200"
      >
        📝 Submit Quiz
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100" style={{ userSelect: 'none' }}>
      {/* --- Top Bar: Timer + Status --- */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3">
          {/* Offline Banner */}
          {!isOnline && (
            <div className="mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2 animate-pulse">
              <span className="h-2.5 w-2.5 bg-red-500 rounded-full"></span>
              <span className="text-red-700 text-xs font-bold">OFFLINE — Timer paused. Your progress is saved locally.</span>
            </div>
          )}

          {/* Timer Paused Banner */}
          {timerPaused && isOnline && (
            <div className="mb-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-yellow-600">⏸️</span>
              <span className="text-yellow-700 text-xs font-bold">Timer paused</span>
            </div>
          )}

          {/* Violation Warning */}
          {violations > 0 && (
            <div className={`mb-2 p-2 rounded-lg border-2 flex items-center justify-between transition-all duration-300 ${isDanger
              ? 'bg-red-50 border-red-300 animate-pulse'
              : isWarning
                ? 'bg-orange-50 border-orange-300'
                : 'bg-yellow-50 border-yellow-300'
              }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{isDanger ? '🚨' : '⚠️'}</span>
                <span className={`text-xs font-black ${isDanger ? 'text-red-700' : isWarning ? 'text-orange-700' : 'text-yellow-700'}`}>
                  {isDanger ? 'CRITICAL: Next violation = auto-submit!' : `Violation ${violations}/${maxViolations}`}
                </span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black ${isDanger
                ? 'bg-red-200 text-red-800'
                : isWarning
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-yellow-200 text-yellow-800'
                }`}>
                {violations}/{maxViolations}
              </div>
            </div>
          )}

          {/* Timer Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-bold text-xs tracking-widest uppercase">Time</span>
              <span className={`font-mono text-xl font-black ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : timeLeft <= 30 ? 'text-orange-600' : 'text-gray-800'
                }`}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
              {timerPaused && <span className="text-yellow-500 text-xs font-bold">⏸ PAUSED</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400">
                Q {currentQIndex + 1}/{totalQ}
              </span>
              {/* Online indicator */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {/* Mobile: toggle palette */}
              <button
                onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                className="lg:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                📋 {mobileDrawerOpen ? 'Hide' : 'Palette'}
              </button>
            </div>
          </div>
          <TimerBar timeLeft={timeLeft} totalTime={totalTime} />
        </div>
      </div>

      {/* --- Main Content: Question + Palette --- */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* LEFT: Question Area */}
          <div className="flex-1 min-w-0">
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-blue-100 mb-4">
              {/* Question Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                    QUESTION {currentQIndex + 1} / {totalQ}
                  </span>
                  <button
                    onClick={() => onToggleBookmark(currentQIndex)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${isCurrentBookmarked
                      ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/30'
                      : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                      }`}
                  >
                    {isCurrentBookmarked ? '🔖 Bookmarked' : '🏷️ Bookmark'}
                  </button>
                </div>
                <h2 className="text-xl font-bold leading-relaxed">{question.questionText}</h2>
              </div>

              {/* Options */}
              <div className="p-5 space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  return (
                    <button
                      key={index}
                      onClick={() => onSelectAnswer(currentQIndex, index)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group active:scale-[0.99] ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                        : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                    >
                      <div className="flex items-center">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center mr-4 font-bold text-sm transition-colors flex-shrink-0 ${isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                          }`}>
                          {isSelected ? '✓' : String.fromCharCode(65 + index)}
                        </div>
                        <span className={`text-base font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                {/* Left group */}
                <div className="flex gap-2">
                  <button
                    onClick={onGoToPrev}
                    disabled={currentQIndex === 0}
                    className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => onClearAnswer(currentQIndex)}
                    disabled={selectedAnswer === null || selectedAnswer === undefined}
                    className="px-4 py-2.5 rounded-lg bg-gray-50 text-gray-500 font-medium text-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    ✕ Clear
                  </button>
                </div>

                {/* Right group */}
                <div className="flex gap-2">
                  <button
                    onClick={onMarkAndNext}
                    className="px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700 font-bold text-sm border border-violet-200 hover:bg-violet-100 transition-all duration-200 flex items-center gap-1.5"
                  >
                    🔖 Mark & Next
                  </button>

                  {currentQIndex < totalQ - 1 ? (
                    <button
                      onClick={onSaveAndNext}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-blue-200 flex items-center gap-1.5"
                    >
                      Save & Next →
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md shadow-green-200 flex items-center gap-1.5"
                    >
                      📝 Submit Quiz
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Secure Mode Indicator */}
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs font-bold">
                <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                SECURE EXAM MODE ACTIVE
              </span>
            </div>
          </div>

          {/* RIGHT: Question Palette — Desktop only */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-32">
              <QuestionPalette className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Bottom Drawer --- */}
      {mobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="h-1 w-10 bg-gray-300 rounded-full"></div>
            </div>
            <QuestionPalette className="p-5" />
          </div>
        </>
      )}

      {/* --- Submit Confirmation Modal --- */}
      {showSubmitModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSubmitModal(false)}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-xl font-black">Submit Quiz?</h3>
                <p className="text-orange-100 text-sm mt-1">Please review your submission summary</p>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                    <span className="block text-2xl font-black text-emerald-600">{stats.answered || 0}</span>
                    <span className="text-xs font-bold text-emerald-400">Answered</span>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                    <span className="block text-2xl font-black text-red-500">{stats.notAnswered || 0}</span>
                    <span className="text-xs font-bold text-red-400">Not Answered</span>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
                    <span className="block text-2xl font-black text-violet-600">{stats.marked || 0}</span>
                    <span className="text-xs font-bold text-violet-400">Marked for Review</span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                    <span className="block text-2xl font-black text-amber-600">{stats.answeredAndMarked || 0}</span>
                    <span className="text-xs font-bold text-amber-400">Answered & Marked</span>
                  </div>
                </div>

                {/* Warning for unanswered */}
                {(stats.notAnswered > 0 || stats.marked > 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">⚠️</span>
                      <p className="text-yellow-700 text-xs leading-relaxed">
                        {stats.notAnswered > 0 && (
                          <span>You have <strong>{stats.notAnswered} unanswered</strong> question{stats.notAnswered > 1 ? 's' : ''}. </span>
                        )}
                        {stats.marked > 0 && (
                          <span>You have <strong>{stats.marked} marked</strong> question{stats.marked > 1 ? 's' : ''} for review. </span>
                        )}
                        Are you sure you want to submit?
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all duration-200"
                  >
                    ← Go Back
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmitModal(false);
                      onSubmitQuiz();
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-200"
                  >
                    ✅ Submit Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slide-up animation for mobile drawer */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GameCanvas;