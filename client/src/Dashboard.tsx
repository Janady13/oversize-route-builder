import React, { useState, useEffect } from 'react';
import { FaUpload, FaFileAlt, FaRoute, FaSignOutAlt, FaUser, FaCreditCard } from 'react-icons/fa';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  companyName: string;
  subscription: {
    status: string;
    plan: string;
  };
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    loadUserData();
    loadPermits();
  }, []);

  const loadUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadPermits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api/permits`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPermits(response.data.permits);
    } catch (error) {
      console.error('Error loading permits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, state: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('permit', file);
    formData.append('state', state);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api/permits/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadSuccess(`Permit ${response.data.permit.permitNumber} uploaded successfully!`);
      loadPermits();
      
      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(''), 5000);
    } catch (error: any) {
      setUploadError(error.response?.data?.error?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Oversize Route Builder</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.companyName}
              </span>
              <button
                onClick={() => window.location.href = '/dashboard/subscription'}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <FaCreditCard />
                <span className="text-sm capitalize">{user?.subscription?.plan || 'No Plan'}</span>
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/profile'}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <FaUser />
                <span className="text-sm">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <FaSignOutAlt />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.companyName}!
          </h2>
          <p className="text-gray-600">
            Upload your permit documents to generate compliant routes automatically.
          </p>
        </div>

        {/* Upload Errors/Success */}
        {uploadError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {uploadSuccess}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Upload Permit Document</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Oklahoma Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition">
              <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">Oklahoma Permit</h4>
              <p className="text-sm text-gray-600 mb-4">
                Upload your Oklahoma DOT permit PDF
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'OK')}
                  disabled={uploading}
                  className="hidden"
                />
                <span className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Select File'}
                </span>
              </label>
            </div>

            {/* Texas Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition">
              <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">Texas Permit</h4>
              <p className="text-sm text-gray-600 mb-4">
                Upload your Texas DOT permit PDF
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'TX')}
                  disabled={uploading}
                  className="hidden"
                />
                <span className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Select File'}
                </span>
              </label>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Supported formats: PDF (max 10MB) • Your data is encrypted and secure
          </p>
        </div>

        {/* Recent Permits */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-8 py-6 border-b">
            <h3 className="text-xl font-bold text-gray-900">Recent Permits</h3>
          </div>

          {permits.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No permits yet</h4>
              <p className="text-gray-600">
                Upload your first permit document to get started
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {permits.map((permit) => (
                <div
                  key={permit.id}
                  className="px-8 py-6 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => window.location.href = `/dashboard/permits/${permit.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <FaFileAlt className="text-primary-600 text-xl" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {permit.permit_number}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {permit.state} • {permit.original_filename}
                        </p>
                        {permit.origin_location && permit.destination_location && (
                          <p className="text-xs text-gray-500 mt-1">
                            <FaRoute className="inline mr-1" />
                            {permit.origin_location} → {permit.destination_location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        permit.status === 'processed' 
                          ? 'bg-green-100 text-green-800'
                          : permit.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {permit.status}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(permit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Permits</p>
                <p className="text-3xl font-bold text-gray-900">{permits.length}</p>
              </div>
              <FaFileAlt className="text-4xl text-primary-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Routes Generated</p>
                <p className="text-3xl font-bold text-gray-900">
                  {permits.filter(p => p.origin_location).length}
                </p>
              </div>
              <FaRoute className="text-4xl text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Subscription</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {user?.subscription?.plan || 'None'}
                </p>
              </div>
              <FaCreditCard className="text-4xl text-blue-600 opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
