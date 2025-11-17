import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Form from '../../components/Form';
import { showToast } from '../../components/Toast';
import { GraduationCap, Key } from 'lucide-react';

const ExamAccess = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [testKey, setTestKey] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // If user is logged in, load their profile
    if (user && user.role === 'student') {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await studentApi.getProfile();
      setProfile(response.data);
      setFullName(response.data.full_name || user?.fullName || user?.name || '');
    } catch (error) {
      // If not logged in, that's okay
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testKey.trim() || !fullName.trim()) {
      showToast('Please enter test key and your name', 'error');
      return;
    }
    
    setLoading(true);

    try {
      // If user is logged in, pass their ID to update their file
      const studentId = user?.id || null;
      const response = await studentApi.accessTest(
        testKey.toUpperCase().trim(), 
        fullName,
        studentId
      );
      
      // Update auth if user is logged in
      if (user && user.role === 'student') {
        // Student already logged in, just navigate
        showToast('Test key accepted! Redirecting to exam...', 'success');
        navigate(`/exam/${testKey.toUpperCase().trim()}`);
      } else {
        // New access, login with attempt token
        login(
          { ...response.data.attempt, role: 'student' },
          response.data.accessToken,
          response.data.refreshToken
        );
        showToast('Access granted', 'success');
        navigate(`/exam/${testKey.toUpperCase().trim()}`);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Invalid test key or name', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Exam Access</h2>
          <p className="text-gray-600 dark:text-gray-400">Enter your test key to begin</p>
        </div>
        <Form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <Input
              label="Test Key"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value.toUpperCase())}
              placeholder="Enter your test key"
              required
              autoFocus
            />
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={!!profile} // Disable if profile loaded
              helperText={profile ? 'Using your registered name' : ''}
            />
            <Button type="submit" className="w-full" disabled={loading} loading={loading}>
              Start Exam
            </Button>
          </div>
        </Form>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExamAccess;
