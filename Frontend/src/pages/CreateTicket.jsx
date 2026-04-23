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
  const [classification, setClassification] = useState(null);
  const [showClassification, setShowClassification] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [errors, setErrors] = useState({});

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
    if (!photo) {
      newErrors.photo = 'Photo upload is mandatory';
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
      return { category: 'General Inquiry', priority: 'Medium' };
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

    setLoading(true);
    try {
      // Step 1: Classify ticket
      toast.loading('Analyzing your issue...');
      const classificationResult = await classifyTicket();
      setClassification(classificationResult);
      setShowClassification(true);
      toast.dismiss();

      // Step 2: Check for duplicates
      const duplicateResult = await checkDuplicates(classificationResult.category);
      if (duplicateResult.hasDuplicate) {
        setDuplicateWarning(duplicateResult.similar);
        toast.error('Similar ticket(s) already exist. Please review them before proceeding.');
        return;
      }

      // Step 3: Wait for user confirmation of classification
      // The classification is now shown and user can proceed
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to process your ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const formDataWithFile = new FormData();
      formDataWithFile.append('title', formData.title);
      formDataWithFile.append('description', formData.description);
      formDataWithFile.append('category', classification.category);
      formDataWithFile.append('photo', photo);

      console.log('Submitting ticket with:', {
        title: formData.title,
        description: formData.description,
        category: classification.category,
        photoName: photo?.name
      });

      const response = await apiClient.post('/tickets/create', formDataWithFile, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Ticket created response:', response.data);

      const createdTicket = response.data.ticket || response.data;
      const ticketNumber = createdTicket.ticketId;
      
      toast.success(
        `✅ Ticket Submitted Successfully!\nTicket ID: ${ticketNumber}`,
        {
          duration: 4000,
          icon: '✅',
        }
      );

      // Reset form
      setFormData({ title: '', description: '' });
      setPhoto(null);
      setPhotoPreview(null);
      setClassification(null);
      setShowClassification(false);

      // Redirect to ticket detail
      setTimeout(() => navigate(`/customer/tickets/${ticketNumber}`), 1500);
    } catch (error) {
      console.error('=== FINAL SUBMISSION ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create ticket';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Ticket</h1>
          <p className="text-slate-600">Describe your issue and our AI will help classify it</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
              {!showClassification ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                      Issue Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="E.g., Payment not reflected in my account"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors ${
                        errors.title ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500 font-medium">{errors.title}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Please provide detailed information about your issue..."
                      rows="6"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors resize-none ${
                        errors.description ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500 font-medium">{errors.description}</p>}
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Upload Screenshot/Photo <span className="text-red-500">*</span>
                    </label>
                    {!photoPreview ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-input"
                        />
                        <label
                          htmlFor="photo-input"
                          className={`cursor-pointer flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg transition-colors ${
                            errors.photo
                              ? 'border-red-500 bg-red-50'
                              : 'border-indigo-300 bg-indigo-50 hover:border-indigo-500'
                          }`}
                        >
                          <PhotoIcon className="h-10 w-10 text-indigo-600 mb-2" />
                          <p className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-500 mt-1">PNG or JPG (max 5MB)</p>
                        </label>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border-2 border-indigo-300 bg-indigo-50">
                        <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    {errors.photo && <p className="mt-2 text-sm text-red-500 font-medium">{errors.photo}</p>}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader size="sm" text="" /> : 'Continue'}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Classification Result */}
                  <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">AI Classification Complete</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-600">CATEGORY</p>
                            <p className="text-lg font-bold text-indigo-600">{classification.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Warning */}
                  {duplicateWarning && duplicateWarning.length > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <ExclamationCircleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-slate-900 mb-2">Similar Ticket(s) Found</h4>
                          <p className="text-sm text-slate-700 mb-3">We found similar issues. Please check if they solve your problem:</p>
                          <div className="space-y-2">
                            {duplicateWarning.map((dup, idx) => (
                              <button
                                key={idx}
                                onClick={() => navigate(`/customer/tickets/${dup.ticketId || dup._id}`)}
                                className="block w-full text-left p-3 bg-white border border-amber-200 rounded-lg hover:border-amber-400 transition-colors"
                              >
                                <p className="text-sm font-semibold text-slate-900">{dup.subject || dup.title || 'Untitled Ticket'}</p>
                                <p className="text-xs text-slate-500">Status: {dup.status}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowClassification(false);
                        setDuplicateWarning(null);
                      }}
                      className="flex-1 bg-slate-200 text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={loading}
                      className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader size="sm" text="" /> : 'Submit Ticket'}
                    </button>
                  </div>
                </div>
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
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">💡 Tips for Better Results</h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>Be specific with your issue title</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>Include relevant details in description</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>Upload a screenshot showing the problem</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>AI will classify your issue automatically</span>
                </li>
              </ul>
            </div>

            {/* Categories Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">📋 Ticket Categories</h3>
              <div className="space-y-2 text-sm">
                {['Billing', 'Technical Issue', 'Account Issue', 'General Inquiry', 'Bug Report'].map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <span className="h-2 w-2 bg-indigo-600 rounded-full"></span>
                    <span className="text-slate-700">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
