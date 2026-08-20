import React, { useState } from 'react';
import './ExpenditureForm.css';

const ExpenditureForm = ({ isOpen, onClose, onSubmit, pgs = [] }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    pgId: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Maintenance',
    'Electricity',
    'Water',
    'Salary',
    'Food',
    'Internet',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: Number(formData.amount)
      });
      // Reset on success
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        pgId: '',
        description: ''
      });
      onClose();
    } catch (error) {
      console.error("Error submitting expenditure", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="expenditure-modal-overlay">
      <div className="expenditure-modal-content">
        <div className="expenditure-modal-header">
          <h3>Log New Expense</h3>
          <button className="expenditure-close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="expenditure-form">
          <div className="form-group">
            <label>Date *</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>PG Allocation *</label>
            <select name="pgId" value={formData.pgId} onChange={handleChange} required>
              <option value="">Select PG</option>
              {pgs.map(pg => (
                <option key={pg.id} value={pg.id}>{pg.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Amount (₹) *</label>
            <input 
              type="number" 
              name="amount" 
              min="0" 
              step="0.01"
              value={formData.amount} 
              onChange={handleChange} 
              placeholder="e.g. 1500"
              required 
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows="3"
              placeholder="Brief description of the expense..."
            ></textarea>
          </div>
          <div className="expenditure-form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenditureForm;
