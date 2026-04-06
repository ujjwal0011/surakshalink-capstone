import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api'; // Ensure this points to your axios instance
import toast from 'react-hot-toast';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. Basic Quiz Settings
  const [quizDetails, setQuizDetails] = useState({
    title: '',
    description: '',
    timeLimit: 60 // Default 1 minute global timer
  });

  // 2. The Questions Array (Starts with 1 empty question)
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }
  ]);

  // --- HANDLERS ---

  // Update Title/Description/Time
  const handleDetailChange = (e) => {
    setQuizDetails({ ...quizDetails, [e.target.name]: e.target.value });
  };

  // Add a new blank question card
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }
    ]);
  };

  // Remove a question card
  const removeQuestion = (index) => {
    if (questions.length === 1) return; // Keep at least one
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // Update Question Text
  const handleQuestionTextChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].questionText = value;
    setQuestions(updatedQuestions);
  };

  // Update Option Text (A, B, C, D)
  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuestions(updatedQuestions);
  };

  // Set Correct Answer
  const handleCorrectOptionChange = (qIndex, oIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].correctOptionIndex = oIndex;
    setQuestions(updatedQuestions);
  };

  // Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic Validation
      if (!quizDetails.title) throw new Error("Quiz Title is required");
      for (let q of questions) {
        if (!q.questionText) throw new Error("All questions must have text");
        // Check if any option is empty
        if (q.options.some(opt => !opt.trim())) throw new Error("All options must be filled");
      }

      // Payload to match Backend Schema
      const payload = {
        ...quizDetails,
        questions
      };

      await api.post('/quiz/create', payload);
      toast.success('Quiz Created Successfully!');
      navigate('/dashboard/teacher/quizzes'); // Redirect to Manager
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create New Drill</h1>
          <button 
            type="button"
            onClick={() => navigate('/dashboard/teacher/quizzes')}
            className="text-gray-600 hover:underline"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: QUIZ DETAILS */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">Step 1: Quiz Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Quiz Title</label>
                <input 
                  type="text" name="title" required
                  placeholder="e.g. Fire Safety Basics"
                  className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  value={quizDetails.title}
                  onChange={handleDetailChange}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  name="description" rows="2"
                  placeholder="Short description..."
                  className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  value={quizDetails.description}
                  onChange={handleDetailChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time Limit (Seconds)</label>
                <input 
                  type="number" name="timeLimit" required min="10"
                  className="w-full mt-1 p-2 border rounded"
                  value={quizDetails.timeLimit}
                  onChange={handleDetailChange}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: QUESTIONS EDITOR */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-blue-600">Step 2: Questions</h2>
              <span className="text-sm text-gray-500">{questions.length} Question(s) Added</span>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
                {/* Remove Button */}
                {questions.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold"
                  >
                    REMOVE
                  </button>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Question {qIndex + 1}</label>
                  <input 
                    type="text" required
                    placeholder="Enter the question here..."
                    className="w-full mt-1 p-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition font-medium text-lg"
                    value={q.questionText}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name={`correct-${qIndex}`} // Unique name per question group
                        checked={q.correctOptionIndex === oIndex}
                        onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                      <input 
                        type="text" required
                        placeholder={`Option ${oIndex + 1}`}
                        className={`w-full p-2 border rounded text-sm ${
                          q.correctOptionIndex === oIndex ? 'border-green-500 bg-green-50' : 'border-gray-300'
                        }`}
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Select the radio button next to the correct answer.</p>
              </div>
            ))}

            <button 
              type="button"
              onClick={addQuestion}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-500 hover:text-blue-600 font-semibold transition"
            >
              + Add Another Question
            </button>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving Quiz...' : 'Publish Quiz'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;