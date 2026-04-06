import TimerBar from './TimerBar';

const GameCanvas = ({
  question,
  timeLeft,
  totalTime,
  onAnswer,
  currentQIndex,
  totalQ,
  violations = 0,
  maxViolations = 3,
}) => {
  // Determine violation severity for styling
  const isWarning = violations >= 2;
  const isDanger = violations >= maxViolations - 1;

  return (
    <div className="max-w-2xl mx-auto w-full" style={{ userSelect: 'none' }}>

      {/* Violation Warning Banner */}
      {violations > 0 && (
        <div className={`mb-4 p-3 rounded-xl border-2 flex items-center justify-between transition-all duration-300 ${isDanger
            ? 'bg-red-50 border-red-300 animate-pulse'
            : isWarning
              ? 'bg-orange-50 border-orange-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{isDanger ? '🚨' : '⚠️'}</span>
            <div>
              <span className={`text-sm font-black ${isDanger ? 'text-red-700' : isWarning ? 'text-orange-700' : 'text-yellow-700'
                }`}>
                {isDanger ? 'CRITICAL WARNING' : 'VIOLATION DETECTED'}
              </span>
              <p className={`text-xs ${isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-yellow-500'
                }`}>
                {isDanger
                  ? 'Next violation will auto-submit your quiz!'
                  : 'Stay in fullscreen and avoid switching tabs.'}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-black ${isDanger
              ? 'bg-red-200 text-red-800'
              : isWarning
                ? 'bg-orange-200 text-orange-800'
                : 'bg-yellow-200 text-yellow-800'
            }`}>
            <span>{violations}</span>
            <span className="text-xs font-medium">/ {maxViolations}</span>
          </div>
        </div>
      )}

      {/* HUD (Heads Up Display) */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-end mb-2">
          <span className="text-gray-500 font-bold text-xs tracking-widest uppercase">Time Remaining</span>
          <span className="font-mono text-xl font-bold text-gray-800">{timeLeft}s</span>
        </div>
        <TimerBar timeLeft={timeLeft} totalTime={totalTime} />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-blue-50">
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-400">
              QUESTION {currentQIndex + 1} / {totalQ}
            </span>
            <span className="text-yellow-300 font-bold">🔥 Streak Mode</span>
          </div>
          <h2 className="text-2xl font-bold leading-tight">{question.questionText}</h2>
        </div>

        {/* Options Grid */}
        <div className="p-6 grid gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-lg text-gray-700 font-medium">{option}</span>
              </div>
            </button>
          ))}
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
  );
};

export default GameCanvas;