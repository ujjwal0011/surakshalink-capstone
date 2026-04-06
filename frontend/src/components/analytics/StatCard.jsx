const StatCard = ({ title, value, subtext, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200"
  };

  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color]} shadow-sm`}>
      <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-black">{value}</span>
        {subtext && <span className="text-sm font-medium opacity-80">{subtext}</span>}
      </div>
    </div>
  );
};

export default StatCard;