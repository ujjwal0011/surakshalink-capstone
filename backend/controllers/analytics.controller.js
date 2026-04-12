import Result from '../models/result.model.js';
import Quiz from '../models/quiz.model.js';

// 1. TEACHER VIEW: Get stats for MY class only
export const getClassAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id; // From auth middleware

    // Fetch Quiz info
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Fetch Results & Populate Student Info
    // We get ALL results for this quiz first
    const allResults = await Result.find({ quizId })
      .populate('studentId', 'name email teacherId')
      .sort({ score: -1 }); // Sort by highest score

    // Filter: Keep only students belonging to THIS Teacher
    const classResults = allResults.filter(r => 
      r.studentId && r.studentId.teacherId.toString() === teacherId
    );

    if (classResults.length === 0) {
      return res.json({ 
        quizTitle: quiz.title, 
        stats: null, 
        leaderboard: [] 
      });
    }

    // Calculate Class Stats
    const totalStudents = classResults.length;
    const totalScore = classResults.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = Math.round(totalScore / totalStudents);
    const passCount = classResults.filter(r => r.score >= 40).length; // Assuming 40% pass

    res.json({
      quizTitle: quiz.title,
      stats: {
        totalStudents,
        avgScore,
        passRate: Math.round((passCount / totalStudents) * 100),
        topScore: classResults[0].score
      },
      leaderboard: classResults.map(r => ({
        _id: r._id,
        name: r.studentId.name,
        score: r.score,
        xp: r.xpEarned,
        timeTaken: r.timeTaken
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. PRINCIPAL VIEW: Compare performance across ALL classes
export const getSchoolAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Fetch Quiz info
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Fetch all results, populate Student AND their Teacher
    const results = await Result.find({ quizId })
      .populate({
        path: 'studentId',
        populate: { path: 'teacherId', select: 'name' } // Get Teacher Name
      })
      .sort({ score: -1 }); // Sort by highest score

    // Group By Teacher
    const classGroups = {};

    results.forEach(r => {
      if (!r.studentId || !r.studentId.teacherId) return;
      
      const teacherName = r.studentId.teacherId.name;
      
      if (!classGroups[teacherName]) {
        classGroups[teacherName] = { 
          teacher: teacherName, 
          scores: [], 
          totalXP: 0 
        };
      }
      classGroups[teacherName].scores.push(r.score);
      classGroups[teacherName].totalXP += r.xpEarned;
    });

    // Calculate Averages per Class
    const classComparisons = Object.values(classGroups).map(group => ({
      teacher: group.teacher,
      avgScore: Math.round(group.scores.reduce((a, b) => a + b, 0) / group.scores.length),
      totalStudents: group.scores.length,
      totalXP: group.totalXP
    }));
    
    if (results.length === 0) {
      return res.json({ 
        quizTitle: quiz.title, 
        schoolStats: null, 
        classComparisons: [],
        leaderboard: [] 
      });
    }

    // Calculate School Stats
    const totalStudents = results.length;
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = Math.round(totalScore / totalStudents);
    const passCount = results.filter(r => r.score >= 40).length;

    res.json({
      quizTitle: quiz.title,
      schoolStats: {
        totalStudents,
        avgScore,
        passRate: Math.round((passCount / totalStudents) * 100),
        topScore: results[0].score
      },
      classComparisons,
      leaderboard: results.map(r => ({
        _id: r._id,
        name: r.studentId?.name || 'Unknown',
        teacherName: r.studentId?.teacherId?.name || 'Unknown',
        score: r.score,
        xp: r.xpEarned,
        timeTaken: r.timeTaken
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};