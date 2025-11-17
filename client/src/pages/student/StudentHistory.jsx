import { useEffect, useState } from 'react';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Loader from '../../components/Loader';
import Button from '../../components/Button';
import { showToast } from '../../components/Toast';
import { Download, Calendar, Award, Key, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attemptsRes, profileRes] = await Promise.all([
        studentApi.getAttempts(),
        studentApi.getProfile(),
      ]);
      setHistory(attemptsRes.data || []);
      setProfile(profileRes.data);
    } catch (error) {
      showToast('Failed to load test history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (attempt) => {
    // TODO: Implement PDF download
    showToast('PDF download feature coming soon', 'info');
  };

  const columns = [
    {
      key: 'attempt',
      label: 'Attempt #',
      render: (_, row, index) => (
        <span className="font-medium text-gray-900 dark:text-white">
          #{index + 1}
        </span>
      )
    },
    {
      key: 'testTitle',
      label: 'Test',
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {value || 'Unknown Test'}
        </span>
      )
    },
    {
      key: 'startedAt',
      label: 'Date',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {value ? new Date(value).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'testKey',
      label: 'Admin Key',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <Key className="w-4 h-4 text-green-500" />
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {value}
              </span>
            </>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    {
      key: 'score',
      label: 'Band Score',
      render: (value, row) => {
        if (row.isSubmitted && value) {
          return (
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {value}%
              </span>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.isSubmitted
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}>
          {row.isSubmitted ? 'Completed' : 'In Progress'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleDownload(row)}
          disabled={!row.isSubmitted}
        >
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
      )
    },
  ];

  if (loading) return <Loader fullScreen />;

  // Combine profile test history with attempts
  const allHistory = profile?.test_history || [];
  const combinedHistory = [...history, ...allHistory].filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id || t.testKey === item.testKey)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test History</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View all your test attempts and results
        </p>
      </div>

      {combinedHistory.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No test history yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Complete a test to see your results here
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table columns={columns} data={combinedHistory} />
        </Card>
      )}

      {/* Statistics Summary */}
      {combinedHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Attempts</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {combinedHistory.length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {combinedHistory.filter(h => h.isSubmitted).length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Score</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {(() => {
                  const scores = combinedHistory
                    .filter(h => h.isSubmitted && h.score)
                    .map(h => parseFloat(h.score) || 0);
                  const avg = scores.length > 0 
                    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                    : 0;
                  return `${avg}%`;
                })()}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;

