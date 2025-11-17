import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Loader from '../../components/Loader';
import Progress from '../../components/Progress';
import { showToast } from '../../components/Toast';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, MapPin, Users,
  BookOpen, CheckCircle, Clock, Award, Key, Play,
  BarChart3, TrendingUp
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testKey, setTestKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        studentApi.getProfile(),
        studentApi.getStats(),
      ]);
      
      if (profileRes && profileRes.data) {
        setProfile(profileRes.data);
      } else {
        console.warn('Profile data not found');
      }
      
      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      } else {
        console.warn('Stats data not found');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast(error.response?.data?.error || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterTestKey = async (e) => {
    e.preventDefault();
    if (!testKey.trim()) {
      showToast('Please enter a test key', 'error');
      return;
    }

    setKeyLoading(true);
    try {
      const response = await studentApi.joinTest(testKey);
      if (response.data.status === 'ready') {
        // Navigate to exam access page
        navigate(`/exam/${testKey}`);
      } else {
        showToast(response.data.message || 'Test is not ready yet', 'info');
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Invalid test key', 'error');
    } finally {
      setKeyLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'not_taken': { 
        label: 'Not Taken', 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        icon: Clock
      },
      'in_progress': { 
        label: 'In Progress', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: Play
      },
      'completed': { 
        label: 'Completed', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: CheckCircle
      },
    };
    const statusInfo = statusMap[status] || statusMap['not_taken'];
    const Icon = statusInfo.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${statusInfo.color}`}>
        <Icon className="w-4 h-4" />
        {statusInfo.label}
      </span>
    );
  };

  if (loading) return <Loader fullScreen />;

  const progressValue = profile?.test_status === 'completed' ? 100 : 
                        profile?.test_status === 'in_progress' ? 50 : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#003B5C] to-[#005A8B] rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Hello, {profile?.full_name || user?.fullName || user?.name || 'Student'}!
            </h1>
            <p className="text-white/80">
              Welcome to your IELTS Mock Test Dashboard
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Profile Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.full_name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {profile?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Registration Date</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {profile?.registered_at 
                      ? new Date(profile.registered_at).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {profile?.region && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Region</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {profile.region}
                    </p>
                  </div>
                </div>
              )}

              {profile?.gender && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {profile.gender}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Test Status Section */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Test Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Status</p>
                  {getStatusBadge(profile?.test_status || 'not_taken')}
                </div>
                {profile?.test_score && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score</p>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {profile.test_score}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Progress value={progressValue} showLabel />

              {profile?.test_status === 'not_taken' && (
                <div className="pt-4">
                  {!showKeyInput ? (
                    <Button 
                      onClick={() => setShowKeyInput(true)}
                      className="w-full"
                    >
                      <Key className="w-5 h-5 mr-2" />
                      Enter Test Key to Start
                    </Button>
                  ) : (
                    <form onSubmit={handleEnterTestKey} className="space-y-3">
                      <Input
                        label="Enter Test Key"
                        value={testKey}
                        onChange={(e) => setTestKey(e.target.value.toUpperCase())}
                        placeholder="Enter your test key"
                        required
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setShowKeyInput(false);
                            setTestKey('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          loading={keyLoading}
                          className="flex-1"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Start Test
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {profile?.test_status === 'in_progress' && (
                <Button 
                  onClick={() => navigate('/student/tests')}
                  className="w-full"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Continue Test
                </Button>
              )}

              {profile?.test_status === 'completed' && profile?.used_admin_key && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    ✓ Test completed using key: <span className="font-mono font-semibold">{profile.used_admin_key}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Total Tests</span>
                </div>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.totalTests || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {stats?.completedTests || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                </div>
                <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats?.inProgressTests || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Average Score</span>
                </div>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.averageScore || 0}%
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/student/profile')}
                className="w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/student/history')}
                className="w-full justify-start"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Test History
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/student/tests')}
                className="w-full justify-start"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                My Tests
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
