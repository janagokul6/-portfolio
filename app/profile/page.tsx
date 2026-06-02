'use client';

import { useState, useEffect } from 'react';
import { MasterProfile, WorkExperience, Education } from '@/lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('auto_apply_api_key') || '';
    setApiKey(saved);
    fetchProfile(saved);
  }, []);

  const fetchProfile = async (key: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile', {
        headers: { 'X-Api-Key': key }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setAuthError(false);
        setError(null);
      } else if (res.status === 401) {
        setAuthError(true);
        setError('Unauthorized. Please enter your API Key.');
      } else {
        setError('Failed to fetch profile.');
      }
    } catch {
      setError('Error fetching profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else if (res.status === 401) {
        setAuthError(true);
        setError('Unauthorized. Please enter your API Key.');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save profile.');
      }
    } catch {
      setError('Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('auto_apply_api_key', apiKey);
    fetchProfile(apiKey);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleWorkChange = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    if (!profile) return;
    const newWork = [...profile.workExperience];
    newWork[index] = { ...newWork[index], [field]: value };
    setProfile({ ...profile, workExperience: newWork });
  };

  const addWork = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      workExperience: [
        ...profile.workExperience,
        { company: '', title: '', startDate: '', endDate: '', current: false, description: '' },
      ],
    });
  };

  const removeWork = (index: number) => {
    if (!profile) return;
    const newWork = [...profile.workExperience];
    newWork.splice(index, 1);
    setProfile({ ...profile, workExperience: newWork });
  };

  const handleEduChange = (index: number, field: keyof Education, value: string) => {
    if (!profile) return;
    const newEdu = [...profile.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setProfile({ ...profile, education: newEdu });
  };

  const addEdu = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: [
        ...profile.education,
        { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' },
      ],
    });
  };

  const removeEdu = (index: number) => {
    if (!profile) return;
    const newEdu = [...profile.education];
    newEdu.splice(index, 1);
    setProfile({ ...profile, education: newEdu });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  }

  if (authError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md mt-12">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Authentication Required</h1>
            <p className="text-gray-500 mt-2 text-sm">Please enter your <code>EXTENSION_API_KEY</code> to access your Master Profile.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="Enter your API Key" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              />
            </div>
            <button 
              onClick={handleSaveApiKey}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Access Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Error loading profile.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Profile</h1>
          <p className="text-gray-600 mt-1">This information will be used to auto-fill job applications.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-200">
          Profile saved successfully!
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" name="firstName" value={profile.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" name="lastName" value={profile.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={profile.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={profile.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" name="location" value={profile.location} onChange={handleChange} placeholder="e.g. San Francisco, CA" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input type="text" name="linkedinUrl" value={profile.linkedinUrl} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <input type="text" name="githubUrl" value={profile.githubUrl} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio/Website</label>
              <input type="text" name="portfolioUrl" value={profile.portfolioUrl} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Skills</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
            <textarea name="skills" value={profile.skills} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="React, Node.js, TypeScript, ..."></textarea>
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Work Experience</h2>
            <button onClick={addWork} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              + Add Experience
            </button>
          </div>
          <div className="space-y-6">
            {profile.workExperience.map((work, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                <button onClick={() => removeWork(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" value={work.company} onChange={(e) => handleWorkChange(index, 'company', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" value={work.title} onChange={(e) => handleWorkChange(index, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="text" value={work.startDate} onChange={(e) => handleWorkChange(index, 'startDate', e.target.value)} placeholder="MM/YYYY" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="text" value={work.endDate} onChange={(e) => handleWorkChange(index, 'endDate', e.target.value)} placeholder="MM/YYYY or Present" disabled={work.current} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200" />
                    <div className="mt-1 flex items-center">
                      <input type="checkbox" id={`current-${index}`} checked={work.current} onChange={(e) => handleWorkChange(index, 'current', e.target.checked)} className="mr-2" />
                      <label htmlFor={`current-${index}`} className="text-sm text-gray-600">I currently work here</label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={work.description} onChange={(e) => handleWorkChange(index, 'description', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>
                </div>
              </div>
            ))}
            {profile.workExperience.length === 0 && (
              <p className="text-gray-500 italic text-sm text-center py-4">No work experience added.</p>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Education</h2>
            <button onClick={addEdu} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              + Add Education
            </button>
          </div>
          <div className="space-y-6">
            {profile.education.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                <button onClick={() => removeEdu(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                    <input type="text" value={edu.institution} onChange={(e) => handleEduChange(index, 'institution', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <input type="text" value={edu.degree} onChange={(e) => handleEduChange(index, 'degree', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                    <input type="text" value={edu.fieldOfStudy} onChange={(e) => handleEduChange(index, 'fieldOfStudy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input type="text" value={edu.startDate} onChange={(e) => handleEduChange(index, 'startDate', e.target.value)} placeholder="YYYY" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input type="text" value={edu.endDate} onChange={(e) => handleEduChange(index, 'endDate', e.target.value)} placeholder="YYYY" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {profile.education.length === 0 && (
              <p className="text-gray-500 italic text-sm text-center py-4">No education added.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
