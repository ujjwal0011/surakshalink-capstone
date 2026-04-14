import User from '../models/user.model.js';
import Result from '../models/result.model.js';
import mongoose from 'mongoose';

// ── Helper: Get date cutoff for time filters ──
const getDateCutoff = (period) => {
  const now = new Date();
  if (period === 'weekly') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'monthly') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null; // alltime
};

// ── Helper: Rank tier from XP ──
const getRankTier = (xp) => {
  if (xp >= 6000) return { tier: 'Legend', icon: '🔥', color: '#ef4444' };
  if (xp >= 3500) return { tier: 'Diamond', icon: '💎', color: '#8b5cf6' };
  if (xp >= 1500) return { tier: 'Gold', icon: '🥇', color: '#f59e0b' };
  if (xp >= 500)  return { tier: 'Silver', icon: '🥈', color: '#9ca3af' };
  return { tier: 'Bronze', icon: '🥉', color: '#d97706' };
};

// ── Helper: Aggregate XP from Results for a time period ──
const aggregateXPByPeriod = async (matchFilter, dateCutoff) => {
  const pipeline = [
    {
      $match: {
        ...matchFilter,
        completedAt: { $gte: dateCutoff }
      }
    },
    {
      $group: {
        _id: '$studentId',
        totalXP: { $sum: '$xpEarned' },
        quizzesCompleted: { $sum: 1 }
      }
    },
    { $sort: { totalXP: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: '$user._id',
        name: '$user.name',
        totalXP: 1,
        quizzesCompleted: 1,
        teacherId: '$user.teacherId',
        allTimeXP: '$user.totalXP'
      }
    }
  ];

  return Result.aggregate(pipeline);
};

// ── Helper: Get all-time ranking from User model ──
const getAllTimeRanking = async (filter) => {
  const users = await User.find({ ...filter, role: 'student' })
    .select('name totalXP teacherId')
    .sort({ totalXP: -1 })
    .lean();

  return users.map(u => ({
    _id: u._id,
    name: u.name,
    totalXP: u.totalXP || 0,
    allTimeXP: u.totalXP || 0,
    teacherId: u.teacherId,
    quizzesCompleted: null // Not tracked for all-time
  }));
};

// ── Helper: Build ranked list with tiers and positions ──
const buildRankedList = (students, currentUserId) => {
  return students.map((s, index) => ({
    rank: index + 1,
    _id: s._id,
    name: s.name,
    xp: s.totalXP || 0,
    allTimeXP: s.allTimeXP || s.totalXP || 0,
    quizzesCompleted: s.quizzesCompleted,
    tier: getRankTier(s.allTimeXP || s.totalXP || 0),
    isCurrentUser: currentUserId ? s._id.toString() === currentUserId.toString() : false,
    teacherId: s.teacherId
  }));
};


// ═══════════════════════════════════════════════════════
// 1. STUDENT LEADERBOARD
// ═══════════════════════════════════════════════════════
export const getStudentLeaderboard = async (req, res) => {
  try {
    const { period = 'alltime' } = req.query;
    const studentId = req.user.id;
    const schoolId = req.user.schoolId;

    // Get current student to find their teacherId
    const currentStudent = await User.findById(studentId).select('teacherId name');
    if (!currentStudent) return res.status(404).json({ message: 'Student not found' });

    let classStudents, schoolStudents;

    if (period === 'alltime') {
      // All-time: direct from User model
      classStudents = await getAllTimeRanking({ schoolId, teacherId: currentStudent.teacherId });
      schoolStudents = await getAllTimeRanking({ schoolId });
    } else {
      // Weekly/Monthly: aggregate from Results
      const dateCutoff = getDateCutoff(period);
      
      // Get all student IDs in this class
      const classStudentIds = await User.find({ 
        schoolId, 
        role: 'student', 
        teacherId: currentStudent.teacherId 
      }).select('_id');
      
      const schoolStudentIds = await User.find({ 
        schoolId, 
        role: 'student' 
      }).select('_id');

      classStudents = await aggregateXPByPeriod(
        { studentId: { $in: classStudentIds.map(s => s._id) } },
        dateCutoff
      );

      schoolStudents = await aggregateXPByPeriod(
        { studentId: { $in: schoolStudentIds.map(s => s._id) } },
        dateCutoff
      );
    }

    // Build ranked lists
    const classRanking = buildRankedList(classStudents, studentId);
    const schoolRanking = buildRankedList(schoolStudents, studentId);

    // Find current user's ranks
    const myClassRank = classRanking.find(r => r.isCurrentUser) || null;
    const mySchoolRank = schoolRanking.find(r => r.isCurrentUser) || null;

    res.json({
      period,
      classRanking,
      schoolRanking,
      myClassRank,
      mySchoolRank,
      myTier: getRankTier(currentStudent.totalXP || 0)
    });

  } catch (err) {
    console.error('Student Leaderboard Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ═══════════════════════════════════════════════════════
// 2. TEACHER LEADERBOARD
// ═══════════════════════════════════════════════════════
export const getTeacherLeaderboard = async (req, res) => {
  try {
    const { period = 'alltime' } = req.query;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    let students;

    if (period === 'alltime') {
      students = await getAllTimeRanking({ schoolId, teacherId });
    } else {
      const dateCutoff = getDateCutoff(period);
      const studentIds = await User.find({ 
        schoolId, 
        role: 'student', 
        teacherId 
      }).select('_id');

      students = await aggregateXPByPeriod(
        { studentId: { $in: studentIds.map(s => s._id) } },
        dateCutoff
      );
    }

    const classRanking = buildRankedList(students, null);

    // Class stats
    const totalXP = classRanking.reduce((sum, s) => sum + s.xp, 0);
    const avgXP = classRanking.length > 0 ? Math.round(totalXP / classRanking.length) : 0;

    res.json({
      period,
      classRanking,
      classStats: {
        totalStudents: classRanking.length,
        totalXP,
        avgXP,
        topPerformer: classRanking[0] || null
      }
    });

  } catch (err) {
    console.error('Teacher Leaderboard Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ═══════════════════════════════════════════════════════
// 3. PRINCIPAL LEADERBOARD
// ═══════════════════════════════════════════════════════
export const getPrincipalLeaderboard = async (req, res) => {
  try {
    const { period = 'alltime' } = req.query;
    const schoolId = req.user.schoolId;

    let students;

    if (period === 'alltime') {
      students = await getAllTimeRanking({ schoolId });
    } else {
      const dateCutoff = getDateCutoff(period);
      const studentIds = await User.find({ 
        schoolId, 
        role: 'student' 
      }).select('_id');

      students = await aggregateXPByPeriod(
        { studentId: { $in: studentIds.map(s => s._id) } },
        dateCutoff
      );
    }

    const schoolRanking = buildRankedList(students, null);

    // ── Class vs Class Comparison ──
    // Get all teachers in this school
    const teachers = await User.find({ schoolId, role: 'teacher' })
      .select('name myClassCode')
      .lean();

    // Group students by teacher
    const classComparisons = [];

    for (const teacher of teachers) {
      const classStudents = schoolRanking.filter(
        s => s.teacherId && s.teacherId.toString() === teacher._id.toString()
      );

      const classTotalXP = classStudents.reduce((sum, s) => sum + s.xp, 0);
      const classAvgXP = classStudents.length > 0 
        ? Math.round(classTotalXP / classStudents.length) 
        : 0;

      classComparisons.push({
        teacherId: teacher._id,
        teacherName: teacher.name,
        classCode: teacher.myClassCode,
        studentCount: classStudents.length,
        totalXP: classTotalXP,
        avgXP: classAvgXP,
        topStudent: classStudents[0] || null
      });
    }

    // Sort classes by avgXP descending
    classComparisons.sort((a, b) => b.avgXP - a.avgXP);

    // Add rank to classes
    classComparisons.forEach((c, i) => { c.rank = i + 1; });

    res.json({
      period,
      schoolRanking: schoolRanking.slice(0, 50), // Top 50 school-wide
      classComparisons,
      schoolStats: {
        totalStudents: schoolRanking.length,
        totalXP: schoolRanking.reduce((sum, s) => sum + s.xp, 0),
        avgXP: schoolRanking.length > 0 
          ? Math.round(schoolRanking.reduce((sum, s) => sum + s.xp, 0) / schoolRanking.length) 
          : 0,
        topPerformer: schoolRanking[0] || null
      }
    });

  } catch (err) {
    console.error('Principal Leaderboard Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
