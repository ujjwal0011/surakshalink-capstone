const TimerBar = ({ timeLeft, totalTime }) => {
  const percentage = (timeLeft / totalTime) * 100;
  
  // Color logic: Green > Yellow > Red
  let colorClass = 'bg-green-500';
  if (percentage < 50) colorClass = 'bg-yellow-500';
  if (percentage < 20) colorClass = 'bg-red-600 animate-pulse';

  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
      <div 
        className={`h-full transition-all duration-1000 ease-linear ${colorClass}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default TimerBar;