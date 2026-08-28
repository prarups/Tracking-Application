import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { axiosClient } from '@/api/axiosClient';
import { User, Shield, Camera, Mail, Phone, Calendar, Copy, Check, Save, AlertCircle, CheckCircle2, BadgeCheck } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [firstName, setFirstName] = useState(currentUser?.first_name || '');
  const [lastName, setLastName] = useState(currentUser?.last_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone_number || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar || null);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      formData.append('phone_number', phoneNumber);

      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const res = await axiosClient.patch('/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = res.data;
      const accessToken = localStorage.getItem('access_token') || '';
      const refreshToken = localStorage.getItem('refresh_token') || '';

      dispatch(setCredentials({ user: updatedUser, access: accessToken, refresh: refreshToken }));
      setSuccessMsg('Profile details & Avatar DP updated successfully!');
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const detail = err.response?.data?.detail || 'Failed to update profile details.';
      setErrorMsg(detail);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            User Account Profile
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Manage your personal profile, employee ID details, and display picture (DP).
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar DP Card */}
        <div className="glass-card p-6 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 space-y-5 text-center flex flex-col items-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center ring-4 ring-blue-500/20">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={currentUser.username}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-3xl text-white">
                  {currentUser.first_name ? currentUser.first_name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Custom DP Upload File Trigger overlay */}
            <label
              htmlFor="avatar-upload-input"
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer transition-all hover:scale-110"
              title="Upload new Display Picture (DP)"
            >
              <Camera className="w-4 h-4" />
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
              <span>{currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser.username}</span>
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{currentUser.username}</div>
          </div>

          {/* Employee ID Badge */}
          <div className="w-full p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between">
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Employee ID</div>
              <div className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                {currentUser.employee_id || 'TRA0001'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentUser.employee_id || 'TRA0001');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
              }}
              title="Copy Employee ID"
              className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-all border border-blue-200 dark:border-slate-800 cursor-pointer"
            >
              {copySuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="w-full pt-3 border-t border-slate-200 dark:border-slate-800/80 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">System Role:</span>
              <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                {currentUser.custom_role_details?.name || currentUser.role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Joined Date:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                {new Date(currentUser.date_joined).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Details Form */}
        <div className="md:col-span-2 glass-card p-6 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Employee Personal Details
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Update your employee display name, email, and dynamic DP avatar.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee ID <span className="text-slate-400">(Auto-Generated)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.employee_id || 'TRA0001'}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-blue-600 dark:text-blue-400 font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username <span className="text-slate-400">(System Handle)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.username}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                  placeholder="e.g. Super"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                  placeholder="e.g. Admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                placeholder="admin@enterprise.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Profile & DP Updates'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
