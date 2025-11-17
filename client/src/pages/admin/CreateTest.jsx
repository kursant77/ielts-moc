import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../api/adminApi';
import { parseJSON, parseXLSX, parseCSV, parseTextFile, parsePDF, parseDOCX } from '../../utils/fileParser';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Form from '../../components/Form';
import FileUploader from '../../components/FileUploader';
import Progress from '../../components/Progress';
import { showToast } from '../../components/Toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ChevronLeft, ChevronRight, Save, Edit2, Check } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Introduction' },
  { id: 2, name: 'Reading' },
  { id: 3, name: 'Listening' },
  { id: 4, name: 'Writing' },
  { id: 5, name: 'Preview' },
];

const CreateTest = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testKey, setTestKey] = useState(null);
  const [testId, setTestId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 180,
    reading: {
      file: null,
      content: '',
      paragraphs: [],
      questions: [],
      answers: '', // Comma-separated answers
    },
    listening: {
      audioFile: null,
      scriptFile: null,
      content: '',
      questions: [],
      answers: '', // Comma-separated answers
    },
    writing: {
      tasks: [
        { id: Date.now(), title: '', content: '' },
        { id: Date.now() + 1, title: '', content: '' },
      ],
    },
    answerKey: {
      reading: {},
      listening: {},
      writing: {},
    },
  });

  // Parse comma-separated answers into answerKey object
  const parseAnswers = (answersString, section) => {
    const answers = answersString.split(',').map(a => a.trim()).filter(a => a);
    const answerKey = {};
    testData[section].questions.forEach((q, idx) => {
      if (answers[idx] !== undefined) {
        answerKey[q.id || idx + 1] = answers[idx];
      }
    });
    return answerKey;
  };

  // Update answers string when questions change
  const updateAnswersFromKey = (section) => {
    const answerKey = testData.answerKey[section];
    const answersArray = testData[section].questions.map((q, idx) => {
      return answerKey[q.id || idx + 1] || '';
    });
    return answersArray.join(', ');
  };

  const handleFileUpload = async (file, section, type) => {
    try {
      let parsedData;
      
      if (type === 'test') {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'json') {
          parsedData = await parseJSON(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedData = await parseXLSX(file);
        } else if (ext === 'csv') {
          parsedData = await parseCSV(file);
        } else if (ext === 'pdf') {
          parsedData = await parsePDF(file);
        } else if (ext === 'docx' || ext === 'doc') {
          parsedData = await parseDOCX(file);
        } else {
          showToast('Unsupported file format', 'error');
          return;
        }

        if (parsedData.questions) {
          setTestData(prev => {
            const newQuestions = parsedData.questions.map((q, idx) => ({
              ...q,
              id: q.id || Date.now() + idx,
            }));
            
            // Extract answers from questions if available
            const newAnswerKey = newQuestions.reduce((acc, q, idx) => {
              if (q.answer !== undefined && q.answer !== null) {
                acc[q.id || idx + 1] = typeof q.answer === 'number' 
                  ? String.fromCharCode(65 + q.answer) 
                  : String(q.answer);
              }
              return acc;
            }, {});
            
            return {
              ...prev,
              [section]: {
                ...prev[section],
                questions: newQuestions,
                file: file,
                // If text content is available (from PDF/DOCX), add it
                content: parsedData.text || prev[section].content,
                paragraphs: parsedData.paragraphs || prev[section].paragraphs,
              },
              answerKey: {
                ...prev.answerKey,
                [section]: { ...prev.answerKey[section], ...newAnswerKey },
              },
            };
          });
          showToast('Test file parsed successfully', 'success');
        } else if (parsedData.text) {
          // If file has text but no questions, just store the content
          setTestData(prev => ({
            ...prev,
            [section]: {
              ...prev[section],
              content: parsedData.text,
              paragraphs: parsedData.paragraphs || [],
              file: file,
            },
          }));
          showToast('File content extracted successfully', 'success');
        }
      } else if (type === 'text') {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'pdf') {
          parsedData = await parsePDF(file);
        } else if (ext === 'docx' || ext === 'doc') {
          parsedData = await parseDOCX(file);
        } else {
          parsedData = await parseTextFile(file);
        }
        
        setTestData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            content: parsedData.text,
            paragraphs: parsedData.paragraphs,
            file: file,
            // If questions were extracted, add them
            questions: parsedData.questions && parsedData.questions.length > 0 
              ? parsedData.questions.map((q, idx) => ({
                  ...q,
                  id: q.id || Date.now() + idx,
                }))
              : prev[section].questions,
          },
        }));
        showToast('File uploaded and parsed', 'success');
      } else if (type === 'audio') {
        setTestData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            audioFile: file,
          },
        }));
        showToast('Audio file uploaded', 'success');
      } else {
        setTestData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [type === 'script' ? 'scriptFile' : 'file']: file,
          },
        }));
        showToast('File uploaded', 'success');
      }
    } catch (error) {
      showToast(error.message || 'Failed to parse file', 'error');
    }
  };

  const handleAnswersChange = (section, answersString) => {
    setTestData(prev => {
      const answerKey = parseAnswers(answersString, section);
      return {
        ...prev,
        [section]: {
          ...prev[section],
          answers: answersString,
        },
        answerKey: {
          ...prev.answerKey,
          [section]: answerKey,
        },
      };
    });
  };

  const selectVariant = (section, questionId, variantIndex) => {
    const variantLetter = String.fromCharCode(65 + variantIndex);
    setTestData(prev => {
      const newAnswerKey = {
        ...prev.answerKey,
        [section]: {
          ...prev.answerKey[section],
          [questionId]: variantLetter,
        },
      };
      
      // Update answers string
      const answersArray = prev[section].questions.map((q, idx) => {
        if (q.id === questionId) {
          return variantLetter;
        }
        return newAnswerKey[section][q.id || idx + 1] || '';
      });
      
      return {
        ...prev,
        answerKey: newAnswerKey,
        [section]: {
          ...prev[section],
          answers: answersArray.join(', '),
        },
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Ensure writing has exactly 2 tasks
      if (testData.writing.tasks.length !== 2) {
        showToast('Writing section must have exactly 2 tasks', 'error');
        setLoading(false);
        return;
      }

      // Parse answers before submitting
      const finalAnswerKey = {
        reading: parseAnswers(testData.reading.answers || '', 'reading'),
        listening: parseAnswers(testData.listening.answers || '', 'listening'),
        writing: testData.answerKey.writing || {},
      };

      const submitData = {
        ...testData,
        answerKey: finalAnswerKey,
      };

      const response = await adminApi.createTest(submitData);
      
      if (response.data.testKey) {
        setTestKey(response.data.testKey);
        setTestId(response.data.testId || response.data.id);
        showToast('Test created successfully! Test key generated.', 'success');
      } else {
        // Auto-generate key if not provided
        if (response.data.id) {
          try {
            const keyResponse = await adminApi.generateTestKey(response.data.id);
            setTestKey(keyResponse.data.key || keyResponse.data.testKey);
            setTestId(response.data.id);
            showToast('Test created and key generated successfully!', 'success');
          } catch (keyError) {
            showToast('Test created successfully', 'success');
            navigate('/admin/tests');
          }
        } else {
          showToast('Test created successfully', 'success');
          navigate('/admin/tests');
        }
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to create test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section) => {
    setEditSection(section);
    setIsEditing(true);
    // Navigate to the appropriate step
    const stepMap = {
      'basic': 1,
      'reading': 2,
      'listening': 3,
      'writing': 4,
    };
    if (stepMap[section]) {
      setCurrentStep(stepMap[section]);
    }
  };

  const nextStep = () => {
    // Validation
    if (currentStep === 1) {
      if (!testData.title.trim()) {
        showToast('Please enter test title', 'error');
        return;
      }
    } else if (currentStep === 2) {
      if (testData.reading.questions.length === 0) {
        showToast('Please add reading questions', 'error');
        return;
      }
    } else if (currentStep === 3) {
      if (testData.listening.questions.length === 0) {
        showToast('Please add listening questions', 'error');
        return;
      }
    } else if (currentStep === 4) {
      if (testData.writing.tasks.length !== 2 || 
          !testData.writing.tasks[0].title.trim() || 
          !testData.writing.tasks[1].title.trim()) {
        showToast('Writing section must have 2 complete tasks', 'error');
        return;
      }
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      setIsEditing(false);
      setEditSection(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setIsEditing(false);
      setEditSection(null);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Test</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/tests')}>
          Cancel
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <Progress value={progress} showLabel />
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  step.id <= currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  step.id < currentStep
                    ? 'bg-primary-600 text-white'
                    : step.id === currentStep
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-2 border-primary-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <p className="text-xs font-medium">{step.name}</p>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                <div className="space-y-4">
                  <Input
                    label="Test Title"
                    value={testData.title}
                    onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                    required
                    placeholder="Enter test title"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <ReactQuill
                      theme="snow"
                      value={testData.description}
                      onChange={(value) => setTestData({ ...testData, description: value })}
                      placeholder="Enter test description"
                    />
                  </div>
                  <Input
                    type="number"
                    label="Duration (minutes)"
                    value={testData.duration}
                    onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) || 180 })}
                    required
                    min={1}
                  />
                </div>
              </Form>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Reading Section
                  </h3>
                  
                  <FileUploader
                    label="Upload Reading Questions File (JSON, XLSX, CSV, PDF, DOCX)"
                    accept=".json,.xlsx,.xls,.csv,.pdf,.docx,.doc"
                    onFileSelect={(file) => handleFileUpload(file, 'reading', 'test')}
                    description="Upload a file containing reading questions. Supported formats: JSON, Excel, CSV, PDF, Word. Variants will be automatically detected."
                  />

                  {testData.reading.file && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          ✓ File uploaded: {testData.reading.file.name}
                        </p>
                      </div>
                      
                      {testData.reading.content && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            File Content (Editable)
                          </label>
                          <div className="border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <ReactQuill
                              theme="snow"
                              value={testData.reading.content}
                              onChange={(value) => setTestData(prev => ({
                                ...prev,
                                reading: { ...prev.reading, content: value }
                              }))}
                              className="bg-white dark:bg-gray-800"
                              placeholder="File content will appear here. You can edit it."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {testData.reading.questions.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Questions ({testData.reading.questions.length})
                      </h4>
                      {testData.reading.questions.map((q, idx) => (
                        <Card key={q.id} className="p-4">
                          <div className="mb-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-2">
                              Question {idx + 1}: {q.question}
                            </p>
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-2 mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Variants:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {q.options.map((opt, optIdx) => {
                                    const variantLetter = String.fromCharCode(65 + optIdx);
                                    const isSelected = testData.answerKey.reading[q.id] === variantLetter;
                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={() => selectVariant('reading', q.id, optIdx)}
                                        className={`p-3 text-left rounded-lg border-2 transition-all ${
                                          isSelected
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                                        }`}
                                      >
                                        <span className="font-medium">{variantLetter}.</span> {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="mt-6">
                    <Input
                      label="Reading Answers (comma-separated)"
                      value={testData.reading.answers || ''}
                      onChange={(e) => handleAnswersChange('reading', e.target.value)}
                      placeholder="a,b,c,asadbek,asad,..."
                      helperText="Enter all answers separated by commas. Example: a,b,c,asadbek,asad"
                    />
                    {testData.reading.questions.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {testData.reading.questions.length} questions expected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Listening Section
                  </h3>
                  
                  <FileUploader
                    label="Upload Listening Audio File"
                    accept="audio/*"
                    onFileSelect={(file) => handleFileUpload(file, 'listening', 'audio')}
                    description="Upload the main audio file for listening section"
                  />

                  {testData.listening.audioFile && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Audio Preview
                      </label>
                      <audio 
                        controls 
                        src={URL.createObjectURL(testData.listening.audioFile)} 
                        className="w-full"
                      />
                    </div>
                  )}

                  <FileUploader
                    label="Upload Listening Questions File (JSON, XLSX, CSV, PDF, DOCX)"
                    accept=".json,.xlsx,.xls,.csv,.pdf,.docx,.doc"
                    onFileSelect={(file) => handleFileUpload(file, 'listening', 'test')}
                    description="Upload a file containing listening questions. Supported formats: JSON, Excel, CSV, PDF, Word."
                    className="mt-4"
                  />

                  {testData.listening.scriptFile && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          ✓ Script file uploaded: {testData.listening.scriptFile.name}
                        </p>
                      </div>
                      
                      {testData.listening.content && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Script Content (Editable)
                          </label>
                          <div className="border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <ReactQuill
                              theme="snow"
                              value={testData.listening.content}
                              onChange={(value) => setTestData(prev => ({
                                ...prev,
                                listening: { ...prev.listening, content: value }
                              }))}
                              className="bg-white dark:bg-gray-800"
                              placeholder="Script content will appear here. You can edit it."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {testData.listening.questions.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Questions ({testData.listening.questions.length})
                      </h4>
                      {testData.listening.questions.map((q, idx) => (
                        <Card key={q.id} className="p-4">
                          <div className="mb-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-2">
                              Question {idx + 1}: {q.question}
                            </p>
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-2 mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Variants:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {q.options.map((opt, optIdx) => {
                                    const variantLetter = String.fromCharCode(65 + optIdx);
                                    const isSelected = testData.answerKey.listening[q.id] === variantLetter;
                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={() => selectVariant('listening', q.id, optIdx)}
                                        className={`p-3 text-left rounded-lg border-2 transition-all ${
                                          isSelected
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                                        }`}
                                      >
                                        <span className="font-medium">{variantLetter}.</span> {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="mt-6">
                    <Input
                      label="Listening Answers (comma-separated)"
                      value={testData.listening.answers || ''}
                      onChange={(e) => handleAnswersChange('listening', e.target.value)}
                      placeholder="a,b,c,asadbek,asad,..."
                      helperText="Enter all answers separated by commas. Example: a,b,c,asadbek,asad"
                    />
                    {testData.listening.questions.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {testData.listening.questions.length} questions expected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Writing Section (2 Tasks Required)
                </h3>
                
                {testData.writing.tasks.map((task, idx) => (
                  <Card key={task.id} className="p-4">
                    <div className="mb-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Task {idx + 1}
                      </span>
                    </div>
                    <Input
                      label="Task Title"
                      value={task.title}
                      onChange={(e) => {
                        const newTasks = [...testData.writing.tasks];
                        newTasks[idx].title = e.target.value;
                        setTestData(prev => ({ ...prev, writing: { tasks: newTasks } }));
                      }}
                      className="mb-3"
                      placeholder={`Enter Task ${idx + 1} title`}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Task Content
                      </label>
                      <ReactQuill
                        theme="snow"
                        value={task.content}
                        onChange={(value) => {
                          const newTasks = [...testData.writing.tasks];
                          newTasks[idx].content = value;
                          setTestData(prev => ({ ...prev, writing: { tasks: newTasks } }));
                        }}
                        placeholder={`Enter Task ${idx + 1} content/instructions`}
                      />
                    </div>
                  </Card>
                ))}
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    ℹ️ Writing section must contain exactly 2 tasks. Both tasks are required.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Test Preview
                  </h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Done Editing' : 'Edit'}
                  </Button>
                </div>

                <Card>
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Basic Information
                        </h4>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit('basic')}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Title:</span> {testData.title || 'Not set'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Description:</span>{' '}
                          {testData.description ? (
                            <div 
                              className="inline-block"
                              dangerouslySetInnerHTML={{ __html: testData.description }}
                            />
                          ) : (
                            'Not set'
                          )}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Duration:</span> {testData.duration} minutes
                        </p>
                      </div>
                    </div>

                    {/* Reading Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Reading Section
                        </h4>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit('reading')}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Questions:</span> {testData.reading.questions.length}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Answers:</span>{' '}
                          {testData.reading.answers || 'Not set'}
                        </p>
                      </div>
                    </div>

                    {/* Listening Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Listening Section
                        </h4>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit('listening')}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Audio:</span>{' '}
                          {testData.listening.audioFile ? testData.listening.audioFile.name : 'Not uploaded'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Questions:</span> {testData.listening.questions.length}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Answers:</span>{' '}
                          {testData.listening.answers || 'Not set'}
                        </p>
                      </div>
                    </div>

                    {/* Writing Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Writing Section
                        </h4>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit('writing')}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3 text-sm">
                        {testData.writing.tasks.map((task, idx) => (
                          <div key={task.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">
                              Task {idx + 1}: {task.title || 'Not set'}
                            </p>
                            {task.content && (
                              <div
                                className="text-gray-600 dark:text-gray-400"
                                dangerouslySetInnerHTML={{ __html: task.content }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {testKey && (
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-300">
                      ✓ Test Key Generated
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                          Test Key
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={testKey}
                            readOnly
                            className="font-mono text-lg font-bold"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(testKey);
                              showToast('Test key copied!', 'success');
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                          Share this key with students to access the test
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : testKey ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/admin/tests')}>
                Go to Tests
              </Button>
              <Button onClick={() => {
                navigator.clipboard.writeText(testKey);
                showToast('Test key copied!', 'success');
              }}>
                Copy Key
              </Button>
            </div>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              <Save className="w-4 h-4" /> Create Test & Generate Key
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateTest;
