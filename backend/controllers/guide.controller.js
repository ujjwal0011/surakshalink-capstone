import Guide from '../models/guide.model.js';

// 1. TEACHER: Create a new Guide
export const createGuide = async (req, res) => {
  try {
    const { title, description, category, coverEmoji, sections } = req.body;

    if (!title || !sections || sections.length === 0) {
      return res.status(400).json({ message: 'Title and at least one section are required.' });
    }

    const newGuide = new Guide({
      title,
      description,
      category: category || 'General',
      coverEmoji: coverEmoji || '📖',
      sections,
      createdBy: req.user.id,
      schoolId: req.user.schoolId
    });

    await newGuide.save();
    res.status(201).json({ message: 'Guide created successfully!', guideId: newGuide._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get All Guides for the School (Teacher, Student, Principal)
export const getGuides = async (req, res) => {
  try {
    const guides = await Guide.find({ schoolId: req.user.schoolId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(guides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Single Guide by ID
export const getGuideById = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    res.json(guide);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. TEACHER: Update a Guide (only the creator can edit)
export const updateGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    // Only the teacher who created it can edit
    if (guide.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own guides.' });
    }

    const { title, description, category, coverEmoji, sections } = req.body;

    guide.title = title || guide.title;
    guide.description = description !== undefined ? description : guide.description;
    guide.category = category || guide.category;
    guide.coverEmoji = coverEmoji || guide.coverEmoji;
    guide.sections = sections || guide.sections;

    await guide.save();
    res.json({ message: 'Guide updated successfully!', guide });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. TEACHER: Delete a Guide (only the creator can delete)
export const deleteGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    // Only the teacher who created it can delete
    if (guide.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own guides.' });
    }

    await Guide.findByIdAndDelete(req.params.id);
    res.json({ message: 'Guide deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Get all unique categories for the school (for filter & suggestions)
export const getCategories = async (req, res) => {
  try {
    const categories = await Guide.distinct('category', { schoolId: req.user.schoolId });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
