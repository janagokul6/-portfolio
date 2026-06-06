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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, checked } = e.target;
    setProfile({ ...profile, [name]: checked });
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
    return <div className="p-8 text-center text-[var(--gray)]">Loading profile...</div>;
  }

  if (authError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md mt-12">
        <div className="p-8 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#6366f1]/10 text-[#6366f1] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--white)]">Authentication Required</h1>
            <p className="text-[var(--gray)] mt-2 text-sm">Please enter your <code>EXTENSION_API_KEY</code> to access your Master Profile.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="Enter your API Key" 
                className="form-field font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              />
            </div>
            <button 
              onClick={handleSaveApiKey}
              className="btn btn-fill btn-lg w-full justify-center"
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
    <div className="w-full min-h-screen flex justify-center">
      <div className="w-full max-w-[1600px] px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--white)]">Master Profile</h1>
          <p className="text-[var(--gray)] mt-1 text-sm sm:text-base">This information is used to auto-fill job applications.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !apiKey}
          className="btn btn-fill !text-xs sm:!text-sm !px-3 !py-1.5 sm:!px-5 sm:!py-2.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap self-stretch sm:self-auto flex justify-center"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {authError && (
        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h3 className="text-red-400 font-semibold mb-2">API Key Required</h3>
          <p className="text-[var(--gray)] mb-4 text-sm">Please set your API key to access and save your Master Profile.</p>
          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API Key..."
              className="form-field max-w-md"
            />
            <button onClick={handleSaveApiKey} className="btn btn-fill">Save Key</button>
          </div>
        </div>
      )}

      {error && !authError && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm">
          Profile saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8">
        {/* Column 1 */}
        <div className="space-y-6 xl:space-y-8">
          {/* Basic Info */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <h2 className="text-xl font-semibold mb-6 text-[var(--white)]">Basic Information</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">First Name</label>
                <input type="text" name="firstName" value={profile.firstName || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Last Name</label>
                <input type="text" name="lastName" value={profile.lastName || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Email</label>
                <input type="email" name="email" value={profile.email || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Phone</label>
                <input type="text" name="phone" value={profile.phone || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Pronouns</label>
                <input type="text" name="pronouns" value={profile.pronouns || ''} onChange={handleChange} placeholder="e.g. They/Them" className="form-field" />
              </div>
            </div>
          </div>

          {/* Skills & Languages */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <h2 className="text-xl font-semibold mb-6 text-[var(--white)]">Skills & Languages</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Core Skills (comma separated)</label>
                <textarea name="skills" value={profile.skills || ''} onChange={handleChange} rows={4} className="form-field" placeholder="React, Node.js, TypeScript, Next.js, System Design..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Languages Spoken</label>
                <input type="text" name="languages" value={profile.languages || ''} onChange={handleChange} placeholder="e.g. English (Native), Spanish (Conversational)" className="form-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-6 xl:space-y-8">
          {/* Address Details */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <h2 className="text-xl font-semibold mb-6 text-[var(--white)]">Address</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Street Address</label>
                <input type="text" name="address" value={profile.address || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">City</label>
                <input type="text" name="city" value={profile.city || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">State / Province</label>
                <input type="text" name="state" value={profile.state || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Postal / Zip Code</label>
                <input type="text" name="zip" value={profile.zip || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Country</label>
                <input type="text" name="country" value={profile.country || ''} onChange={handleChange} className="form-field" />
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <h2 className="text-xl font-semibold mb-6 text-[var(--white)]">Online Presence</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">LinkedIn URL</label>
                <input type="text" name="linkedinUrl" value={profile.linkedinUrl || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">GitHub URL</label>
                <input type="text" name="githubUrl" value={profile.githubUrl || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Portfolio/Website</label>
                <input type="text" name="portfolioUrl" value={profile.portfolioUrl || ''} onChange={handleChange} className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Twitter/X URL</label>
                <input type="text" name="twitterUrl" value={profile.twitterUrl || ''} onChange={handleChange} className="form-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-6 xl:space-y-8">
          {/* Job Preferences */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <h2 className="text-xl font-semibold mb-6 text-[var(--white)]">Job Preferences</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Desired Salary</label>
                <input type="text" name="desiredSalary" value={profile.desiredSalary || ''} onChange={handleChange} placeholder="e.g. $120,000" className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Notice Period / Start Date</label>
                <input type="text" name="noticePeriod" value={profile.noticePeriod || ''} onChange={handleChange} placeholder="e.g. Immediately, 2 weeks" className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">How did you hear about us?</label>
                <input type="text" name="howDidYouHear" value={profile.howDidYouHear || ''} onChange={handleChange} placeholder="e.g. LinkedIn, Company Website" className="form-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Security Clearance</label>
                <input type="text" name="securityClearance" value={profile.securityClearance || ''} onChange={handleChange} placeholder="e.g. None, Secret, Top Secret" className="form-field" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label htmlFor="willingToRelocate" className="text-sm font-medium text-[var(--white)]">Willing to Relocate</label>
                <input type="checkbox" id="willingToRelocate" name="willingToRelocate" checked={profile.willingToRelocate || false} onChange={handleCheckboxChange} className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="authorizedToWork" className="text-sm font-medium text-[var(--white)]">Authorized to Work in US</label>
                <input type="checkbox" id="authorizedToWork" name="authorizedToWork" checked={profile.authorizedToWork || false} onChange={handleCheckboxChange} className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="sponsorshipRequired" className="text-sm font-medium text-[var(--white)]">Sponsorship Required</label>
                <input type="checkbox" id="sponsorshipRequired" name="sponsorshipRequired" checked={profile.sponsorshipRequired || false} onChange={handleCheckboxChange} className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Demographics / EEO */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <h2 className="text-xl font-semibold mb-6 text-[var(--white)]">EEO / Demographics</h2>
            <p className="text-xs text-[var(--dim)] mb-5">This data is strictly for equal employment opportunity (EEO) surveys on ATS platforms.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Gender</label>
                <select name="gender" value={profile.gender || ''} onChange={handleChange} className="form-field">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Race/Ethnicity</label>
                <select name="race" value={profile.race || ''} onChange={handleChange} className="form-field">
                  <option value="">Select...</option>
                  <option value="Hispanic or Latino">Hispanic or Latino</option>
                  <option value="White">White</option>
                  <option value="Black or African American">Black or African American</option>
                  <option value="Asian">Asian</option>
                  <option value="Native Hawaiian or Pacific Islander">Native Hawaiian or Pacific Islander</option>
                  <option value="Two or More Races">Two or More Races</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Veteran Status</label>
                <select name="veteran" value={profile.veteran || ''} onChange={handleChange} className="form-field">
                  <option value="">Select...</option>
                  <option value="I am not a protected veteran">I am not a protected veteran</option>
                  <option value="I identify as one or more of the classifications of a protected veteran">I identify as a protected veteran</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Disability Status</label>
                <select name="disability" value={profile.disability || ''} onChange={handleChange} className="form-field">
                  <option value="">Select...</option>
                  <option value="Yes, I have a disability">Yes, I have a disability</option>
                  <option value="No, I don't have a disability">No, I don't have a disability</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4 */}
        <div className="space-y-6 xl:space-y-8">
          {/* Context Documents */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <h2 className="text-xl font-semibold mb-6 text-[var(--white)]">Documents & Custom Rules</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Resume Text (Plain Text)</label>
                <textarea name="resumeText" value={profile.resumeText || ''} onChange={handleChange} rows={12} className="form-field" placeholder="Paste your full resume here so the AI can use it to answer application questions..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Cover Letter Text (Plain Text)</label>
                <textarea name="coverLetterText" value={profile.coverLetterText || ''} onChange={handleChange} rows={12} className="form-field" placeholder="Paste your default cover letter here..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray)] mb-1.5">Custom AI Instructions</label>
                <textarea name="customInstructions" value={profile.customInstructions || ''} onChange={handleChange} rows={8} className="form-field" placeholder="e.g. Always answer 'No' to felony questions. If asked about years of React, say 5 years."></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Row - Dynamic Arrays */}
        <div className="md:col-span-2 xl:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
          {/* Work Experience */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--white)]">Work Experience</h2>
              <button onClick={addWork} className="text-[#6366f1] hover:text-[#4f46e5] text-sm font-medium transition-colors">
                + Add Experience
              </button>
            </div>
            <div className="space-y-6">
              {profile.workExperience.map((work, index) => (
                <div key={index} className="p-5 border border-[var(--border)] rounded-lg bg-[var(--surface)] relative">
                  <button onClick={() => removeWork(index)} className="absolute top-5 right-5 text-red-500 hover:text-red-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Company</label>
                      <input type="text" value={work.company} onChange={(e) => handleWorkChange(index, 'company', e.target.value)} className="form-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Title</label>
                      <input type="text" value={work.title} onChange={(e) => handleWorkChange(index, 'title', e.target.value)} className="form-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Start Date</label>
                      <input type="text" value={work.startDate} onChange={(e) => handleWorkChange(index, 'startDate', e.target.value)} placeholder="MM/YYYY" className="form-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">End Date</label>
                      <input type="text" value={work.endDate} onChange={(e) => handleWorkChange(index, 'endDate', e.target.value)} placeholder="MM/YYYY or Present" disabled={work.current} className="form-field disabled:opacity-50" />
                      <div className="mt-2 flex items-center">
                        <input type="checkbox" id={`current-${index}`} checked={work.current} onChange={(e) => handleWorkChange(index, 'current', e.target.checked)} className="mr-2" />
                        <label htmlFor={`current-${index}`} className="text-sm text-[var(--gray)]">I currently work here</label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Description</label>
                      <textarea value={work.description} onChange={(e) => handleWorkChange(index, 'description', e.target.value)} rows={3} className="form-field"></textarea>
                    </div>
                  </div>
                </div>
              ))}
              {profile.workExperience.length === 0 && (
                <p className="text-[var(--dim)] italic text-sm text-center py-4">No work experience added.</p>
              )}
            </div>
          </div>

          {/* Education */}
          <div className="p-6 rounded-xl border border-[var(--border)]" style={{ background: 'var(--card)', backdropFilter: 'blur(12px)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--white)]">Education</h2>
              <button onClick={addEdu} className="text-[#6366f1] hover:text-[#4f46e5] text-sm font-medium transition-colors">
                + Add Education
              </button>
            </div>
            <div className="space-y-6">
              {profile.education.map((edu, index) => (
                <div key={index} className="p-5 border border-[var(--border)] rounded-lg bg-[var(--surface)] relative">
                  <button onClick={() => removeEdu(index)} className="absolute top-5 right-5 text-red-500 hover:text-red-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Institution</label>
                      <input type="text" value={edu.institution} onChange={(e) => handleEduChange(index, 'institution', e.target.value)} className="form-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Degree</label>
                      <input type="text" value={edu.degree} onChange={(e) => handleEduChange(index, 'degree', e.target.value)} className="form-field" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Field of Study</label>
                      <input type="text" value={edu.fieldOfStudy} onChange={(e) => handleEduChange(index, 'fieldOfStudy', e.target.value)} className="form-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">Start Date</label>
                      <input type="text" value={edu.startDate} onChange={(e) => handleEduChange(index, 'startDate', e.target.value)} placeholder="YYYY" className="form-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--gray)] mb-1">End Date</label>
                      <input type="text" value={edu.endDate} onChange={(e) => handleEduChange(index, 'endDate', e.target.value)} placeholder="YYYY" className="form-field" />
                    </div>
                  </div>
                </div>
              ))}
              {profile.education.length === 0 && (
                <p className="text-[var(--dim)] italic text-sm text-center py-4">No education added.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
