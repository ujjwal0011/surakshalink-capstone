import User from '../models/user.model.js';
import School from '../models/school.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper to generate a unique Class Code (e.g., TCH-4821)
const generateClassCode = () => 'TCH-' + Math.floor(1000 + Math.random() * 9000);

// Helper for School Code
const generateSchoolCode = () => 'SCH-' + Math.floor(1000 + Math.random() * 9000);

// 1. REGISTER PRINCIPAL (Unchanged)
export const registerPrincipal = async (req, res) => {
  try {
    const { name, email, password, schoolName, schoolAddress } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Note: We keep studentPin as a fallback, but primary method is now Class Code
    const teacherPin = Math.floor(1000 + Math.random() * 9000).toString();
    const studentPin = Math.floor(1000 + Math.random() * 9000).toString();
    const schoolCode = generateSchoolCode();

    const newSchool = new School({
      name: schoolName,
      address: schoolAddress,
      schoolCode,
      teacherPin,
      studentPin
    });
    const savedSchool = await newSchool.save();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPrincipal = new User({
      name,
      email,
      password: hashedPassword,
      role: 'principal',
      schoolId: savedSchool._id
    });
    await newPrincipal.save();

    res.status(201).json({
      message: "School registered!",
      schoolCode,
      teacherPin,
      studentPin
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. REGISTER TEACHER (Updated to generate Class Code)
export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password, schoolCode, teacherPin } = req.body;

    const school = await School.findOne({ schoolCode });
    if (!school) return res.status(404).json({ message: "School not found" });

    if (school.teacherPin !== teacherPin) {
      return res.status(401).json({ message: "Invalid Teacher PIN" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already taken" });

    // Generate a Unique Class Code
    let uniqueClassCode = generateClassCode();
    // (Optional: simple check to ensure uniqueness, though collision is rare)
    while (await User.findOne({ myClassCode: uniqueClassCode })) {
      uniqueClassCode = generateClassCode();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = new User({
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
      schoolId: school._id,
      myClassCode: uniqueClassCode // Save the code!
    });
    await newTeacher.save();

    res.status(201).json({ 
      message: "Teacher registered successfully!",
      classCode: uniqueClassCode // Return this so they can share it!
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. REGISTER STUDENT (Updated to use Class Code)
export const registerStudent = async (req, res) => {
  try {
    // Input is now 'classCode' instead of schoolCode/studentPin
    const { name, email, password, classCode } = req.body;

    // 1. Find the Teacher who owns this code
    const teacher = await User.findOne({ myClassCode: classCode, role: 'teacher' });
    
    if (!teacher) {
      return res.status(404).json({ message: "Invalid Class Code. Ask your teacher." });
    }

    // 2. Check if student email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create Student
    const newStudent = new User({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      // Automatically link to the Teacher's School
      schoolId: teacher.schoolId, 
      // Link to the specific Teacher
      teacherId: teacher._id 
    });
    await newStudent.save();

    res.status(201).json({ message: "Student registered and joined class!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. LOGIN (Unchanged)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate('schoolId');
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, schoolId: user.schoolId._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        schoolName: user.schoolId.name,
        // Send the class code back if they are a teacher
        myClassCode: user.myClassCode 
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};