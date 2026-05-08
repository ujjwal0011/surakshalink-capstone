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

export const getTeachersBySchool = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const teachers = await User.find({ schoolId, role: 'teacher' })
      .select('-password')
      .sort({ name: 1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};