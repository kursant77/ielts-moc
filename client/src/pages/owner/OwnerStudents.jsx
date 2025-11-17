import { useEffect, useState } from 'react';
import { ownerApi } from '../../api/ownerApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { showToast } from '../../components/Toast';
import { Eye, User, Mail, Phone, Calendar, Key, Award, Edit } from 'lucide-react';

const OwnerStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // Load ALL registered students from file-based storage
      const response = await ownerApi.getAllUsers();
      if (response && response.data) {
        setStudents(Array.isArray(response.data) ? response.data : []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showToast(error.response?.data?.error || 'Failed to load students', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (studentId) => {
    try {
      if (!studentId) {
        showToast('Invalid student ID', 'error');
        return;
      }
      const response = await ownerApi.getUserById(studentId);
      if (response && response.data) {
        setSelectedStudent(response.data);
        setShowModal(true);
      } else {
        showToast('Student data not found', 'error');
      }
    } catch (error) {
      console.error('Error loading student details:', error);
      showToast(error.response?.data?.error || 'Failed to load student details', 'error');
    }
  };

  const handleViewResults = async (studentId) => {
    try {
      if (!studentId) {
        showToast('Invalid student ID', 'error');
        return;
      }
      const response = await ownerApi.getUserResults(studentId);
      if (response && response.data) {
        const results = Array.isArray(response.data) ? response.data : [];
        if (results.length > 0) {
          setSelectedStudent({
            ...selectedStudent,
            results: results
          });
          showToast(`Found ${results.length} test result(s)`, 'success');
        } else {
          showToast('No test results found for this student', 'info');
        }
      } else {
        showToast('No test results found for this student', 'info');
      }
    } catch (error) {
      console.error('Error loading results:', error);
      showToast(error.response?.data?.error || 'Failed to load results', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'not_taken': { label: 'Not Taken', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
      'in_progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    };
    const statusInfo = statusMap[status] || statusMap['not_taken'];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.test_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { 
      key: 'full_name', 
      label: 'Full Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{value || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">{value || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'phone', 
      label: 'Phone',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">{value || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'username', 
      label: 'Username',
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">{value || 'N/A'}</span>
      )
    },
    { 
      key: 'registered_at', 
      label: 'Registered',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300 text-sm">
            {value ? new Date(value).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      )
    },
    { 
      key: 'test_status', 
      label: 'Test Status',
      render: (value) => getStatusBadge(value)
    },
    { 
      key: 'test_score', 
      label: 'Score',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.test_status === 'completed' && value ? (
            <>
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    { 
      key: 'used_admin_key', 
      label: 'Admin Key',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <Key className="w-4 h-4 text-green-500" />
              <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{value}</span>
            </>
          ) : (
            <span className="text-gray-400 text-sm">Not used</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleViewStudent(row.id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        </div>
      )
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Students</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            All registered students on the platform ({filteredStudents.length} of {students.length})
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, username..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="not_taken">Not Taken</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={filteredStudents} />
      </Card>

      {/* Student Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedStudent(null);
        }}
        title="Student Details"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedStudent.full_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white break-all">
                    {selectedStudent.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {selectedStudent.username || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Login
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {selectedStudent.login || selectedStudent.username || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedStudent.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Birth Date
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedStudent.birth_date 
                      ? new Date(selectedStudent.birth_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <p className="text-gray-900 dark:text-white capitalize font-medium">
                    {selectedStudent.gender || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedStudent.region || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password Hash
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-xs break-all bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    {selectedStudent.password_hash || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is a hashed password for security purposes
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Registration Date
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedStudent.registered_at 
                      ? new Date(selectedStudent.registered_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Login
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedStudent.last_login 
                      ? new Date(selectedStudent.last_login).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Test Status
                  </label>
                  {getStatusBadge(selectedStudent.test_status || 'not_taken')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Test Score
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedStudent.test_score || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Key Used
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm">
                    {selectedStudent.used_admin_key || 'Not used'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => handleViewResults(selectedStudent.id)}
              >
                View Test Results
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OwnerStudents;
