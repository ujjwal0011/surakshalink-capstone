import User from '../models/user.model.js';

export const getStudentsBySchool = async (req, res) => {
  try {
    const { schoolId, role, id } = req.user;
    
    let query = { schoolId, role: 'student' };

    if (role === 'teacher') {
      query.teacherId = id; 
    }

    const students = await User.find(query)
      .select('-password')
      // UPDATE: We now populate the 'teacherId' field to get the teacher's name
      .populate('teacherId', 'name email') 
      .sort({ name: 1 });
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};