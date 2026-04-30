// src/pages/CreateTicket.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, PhotoIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import Loader from '../components/UI/Loader';

const CreateTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState(null);
  const [outOfScopeError, setOutOfScopeError] = useState(false);
  const [isSpamTicket, setIsSpamTicket] = useState(false);
  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    //Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Issue title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const classifyTicket = async () => {
    try {
      const response = await apiClient.post('/tickets/classify', {
        title: formData.title,
        description: formData.description,
      });
      return response.data;
    } catch (error) {
      console.error('Classification error:', error);
      // Return default category on error
      return { category: 'Product Issues', priority: 'Medium' };
    }
  };

  const checkDuplicates = async (category) => {
    try {
      const response = await apiClient.post('/tickets/check-duplicates', {
        title: formData.title,
        description: formData.description,
        category,
      });
      return response.data;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return { hasDuplicate: false, similar: [] };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!photo) {
      toast.error('Please upload a screenshot or proof of the issue.');
      return;
    }

    setLoading(true);
    setOutOfScopeError(false);
    setDuplicateWarning(null);

    try {
      toast.loading('Analyzing your ticket...', { id: 'submit-ticket' });
      
      const formDataWithFile = new FormData();
      formDataWithFile.append('title', formData.title);
      formDataWithFile.append('description', formData.description);
      formDataWithFile.append('photo', photo);

      const response = await apiClient.post('/tickets/create', formDataWithFile, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.dismiss('submit-ticket');
      
      const createdTicket = response.data.ticket || response.data;
      
      setSubmittedTicketId(createdTicket.ticketId);
      setIsSpamTicket(response.data.isSpam || false);
      setTicketSubmitted(true);
      
    } catch (error) {
      toast.dismiss('submit-ticket');
      
      const errRes = error.response?.data;
      if (error.response?.status === 400 && errRes?.message?.includes('outside our support scope')) {
        setOutOfScopeError(true);
      } else {
        toast.error(errRes?.message || error.message || 'Failed to create ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Create New Ticket</h1>
          <p className="text-slate-400">Describe your issue and our AI will help classify it</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] shadow-2xl p-8 border border-white/5">
              {ticketSubmitted ? (
                <div className="text-center py-12">
                  <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircleIcon className="h-12 w-12 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ticket Submitted Successfully</h2>
                  <p className="text-slate-400 mb-8">Your ticket #{submittedTicketId} has been created and securely logged.</p>
                  
                  {isSpamTicket && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-6 mb-8 text-left">
                      <div className="flex items-start gap-3">
                        <ExclamationCircleIcon className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-500 mb-1">Photo Verification Required</h4>
                          <p className="text-sm text-amber-200/80">
                            Swift AI noticed that your uploaded photo does not perfectly match your description or appears to be AI-generated. Please open the ticket chat and follow the instructions from Swift AI to provide the correct proof.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setTicketSubmitted(false);
                      setSubmittedTicketId(null);
                      setFormData({ title: '', description: '' });
                      setPhoto(null);
                      setPhotoPreview(null);
                      setOutOfScopeError(false);
                      setIsSpamTicket(false);
                    }}
                    className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Create Another Ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-slate-300 mb-2">
                      Issue Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="E.g., Payment not reflected in my account"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-emerald-600 transition-colors ${
                        errors.title ? 'border-red-500' : 'border-white/10 bg-white/5 text-slate-200'
                      }`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500 font-medium">{errors.title}</p>}
                  </div>

                  {/* Description & Photo Section */}
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="description" className="block text-sm font-semibold text-slate-300 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Please provide detailed information about your issue..."
                        rows="6"
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-emerald-600 transition-colors resize-none h-[180px] ${
                          errors.description ? 'border-red-500' : 'border-white/10 bg-white/5 text-slate-200'
                        }`}
                      />
                      {errors.description && <p className="mt-1 text-sm text-red-500 font-medium">{errors.description}</p>}
                    </div>
                  </div>
                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Proof/Screenshot <span className="text-red-500">*</span>
                    </label>
                    {!photoPreview ? (
                      <div className="relative h-[160px]">
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-input"
                        />
                        <label
                          htmlFor="photo-input"
                          className="cursor-pointer flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg transition-colors border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500"
                        >
                          <PhotoIcon className="h-8 w-8 text-emerald-600 mb-2" />
                          <p className="text-[11px] font-semibold text-slate-300 text-center px-2">Click to upload mandatory screenshot</p>
                          <p className="text-[10px] text-slate-500 mt-1">PNG/JPG &lt; 5MB</p>
                        </label>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500/50 h-[220px] max-w-md">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Out of Scope Error Banner */}
                  {outOfScopeError && (
                    <div className="bg-[#2A1215] border border-red-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">
                          This issue is not within our support scope. Please provide a valid customer support request.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader size="sm" text="" /> : 'Raise Ticket'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Info Panel - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Tips Card */}
            <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] shadow-2xl p-6 border border-white/5">
              <h3 className="font-bold text-white mb-4">💡 Tips for Better Results</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Be specific with your issue title</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Include relevant details in description</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Upload a screenshot showing the problem</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>AI will classify your issue automatically</span>
                </li>
              </ul>
            </div>


          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
