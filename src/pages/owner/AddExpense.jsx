import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './AddExpense.css';
import { UploadCloud, CheckCircle, Receipt, Building, CreditCard, Flag, Tag, Grid, Calendar, FileText, ChevronDown, Trash2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const ExpenseCategories = [
    "ELECTRICITY", "WATER", "GAS", "INTERNET", "MAINTENANCE", "REPAIRS", 
    "CLEANING", "STAFF_SALARY", "SECURITY", "MARKETING", "ADVERTISING", 
    "SOFTWARE", "TRANSPORTATION", "BANK_CHARGES", "INSURANCE", 
    "GOVERNMENT_FEES", "FURNITURE", "APPLIANCES", "MISCELLANEOUS"
];

const PaymentMethods = [
    "CASH", "UPI", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "CHEQUE", "NET_BANKING", "OTHER"
];

const AddExpense = () => {
    const navigate = useNavigate();
    const [pgs, setPgs] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const getTodayDate = () => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    };

    const initialFormState = {
        title: '',
        expenseDate: getTodayDate(),
        paidTo: '',
        paymentMethod: '',
        invoiceNumber: '',
        transactionId: '',
        description: '',
        pgId: '',
        buildingId: '',
        roomId: '',
        gstApplicable: false,
        gstNumber: '',
        taxAmount: '',
        expenseType: 'ONE_TIME',
        frequency: '',
        nextDueDate: '',
        paymentStatus: 'PAID',
        paymentDate: getTodayDate(),
        expenseSource: 'PG_OPERATING_EXPENSE',
        expensePaidBy: 'OWNER'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [items, setItems] = useState([{ category: '', amount: '' }]);
    const [receiptFile, setReceiptFile] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        fetchPgs();
    }, []);

    const fetchPgs = async () => {
        try {
            const res = await api.get('/owner/pgs');
            setPgs(res.data);
        } catch (err) {
            console.error("Failed to load PGs", err);
        }
    };

    const fetchBuildings = async (pgId) => {
        try {
            const res = await api.get(`/owner/floors/pg/${pgId}`);
            setBuildings(res.data);
        } catch (err) {
            console.error("Failed to load buildings", err);
        }
    };

    const fetchRooms = async (floorId) => {
        try {
            const res = await api.get(`/owner/rooms?floorId=${floorId}`);
            setRooms(res.data);
        } catch (err) {
            console.error("Failed to load rooms", err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'pgId') {
            setFormData(prev => ({ ...prev, buildingId: '', roomId: '' }));
            setBuildings([]);
            setRooms([]);
            if (value) fetchBuildings(value);
        }
        if (name === 'buildingId') {
            setFormData(prev => ({ ...prev, roomId: '' }));
            setRooms([]);
            if (value) fetchRooms(value);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { category: '', amount: '' }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleExpenseTypeToggle = (type) => {
        setFormData(prev => ({ ...prev, expenseType: type }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setError("File size exceeds 5MB limit");
                return;
            }
            setReceiptFile(file);
            setError(null);
        }
    };

    const validateForm = () => {
        if (!formData.title) return "Expense title is required.";
        
        for (let i = 0; i < items.length; i++) {
            if (!items[i].category) return `Please select a category for item ${i + 1}.`;
            if (!items[i].amount || isNaN(items[i].amount) || Number(items[i].amount) <= 0) {
                return `Amount must be a valid number greater than 0 for item ${i + 1}.`;
            }
        }

        if (!formData.expenseDate) return "Expense Date is required.";
        if (!formData.pgId) return "Please select a PG.";
        if (!formData.paymentStatus) return "Payment Status is required.";
        
        if (formData.gstApplicable && !formData.gstNumber) return "GST number is required when GST is applicable.";
        if (formData.expenseType === 'RECURRING' && (!formData.frequency || !formData.nextDueDate)) return "Frequency and Next Due Date are required for recurring expenses.";
        if (formData.paymentStatus === 'PAID' && !formData.paymentDate) return "Payment Date is required when status is Paid.";

        return null;
    };

    const submitExpense = async (addAnother = false) => {
        setError(null);
        setSuccessMessage('');
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            window.scrollTo(0, 0);
            return;
        }

        setLoading(true);

        const data = new FormData();
        const expensePayload = { ...formData };
        if (expensePayload.taxAmount === '') expensePayload.taxAmount = 0;
        if (expensePayload.paymentMethod === '') expensePayload.paymentMethod = null;
        if (expensePayload.frequency === '') expensePayload.frequency = null;
        if (expensePayload.buildingId === '') expensePayload.buildingId = null;
        if (expensePayload.roomId === '') expensePayload.roomId = null;
        
        // Create batch payload by merging formData with each item
        const batchPayload = items.map(item => ({
            ...expensePayload,
            category: item.category,
            amount: item.amount
        }));
        
        data.append("expenses", new Blob([JSON.stringify(batchPayload)], { type: "application/json" }));
        if (receiptFile) {
            data.append("receipt", receiptFile);
        }

        try {
            await api.post('/owner/expenses/batch', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (addAnother) {
                setSuccessMessage("Expense saved successfully. You can add another expense.");
                setFormData(initialFormState);
                setItems([{ category: '', amount: '' }]);
                setReceiptFile(null);
                setBuildings([]);
                setRooms([]);
                window.scrollTo(0, 0);
            } else {
                navigate('/owner/ownerRevenue');
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save expense. Please try again.");
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout 
            role="OWNER"
            title="Revenue & Expenditure"
            subtitle="Your complete financial ledger"
        >
            <div className="add-expense-container">
                <div className="add-expense-header">
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/owner/ownerRevenue')} className="back-link">Revenue</span> 
                        <span style={{ margin: '0 6px', color: '#cbd5e1' }}>/</span> 
                        <span>Log Expense</span>
                    </div>
                    <h1>Log New Expense</h1>
                    <p>Add a new expense to keep your finances organized and up to date.</p>
                </div>

                {error && <div className="expense-alert error"><Flag size={16}/> {error}</div>}
                {successMessage && <div className="expense-alert success"><CheckCircle size={16}/> {successMessage}</div>}

                <div className="unified-expense-card">
                    {/* Header */}
                    <div className="unified-header">
                        <div className="icon-wrapper">
                            <Receipt size={24} strokeWidth={2}/>
                        </div>
                        <div className="header-text">
                            <h2>Basic Information</h2>
                            <p>Enter the details of your expense</p>
                        </div>
                        <div className="icon-wrapper right-icon">
                            <FileText size={24} strokeWidth={2}/>
                        </div>
                    </div>

                    <div className="unified-body">
                        {/* Expense Title */}
                        <div className="form-group">
                            <label>Expense Title <span className="req">*</span></label>
                            <div className="input-with-icon-left">
                                <Tag size={18} className="input-icon" />
                                <input type="text" name="title" placeholder="Enter expense title" value={formData.title} onChange={handleChange} />
                            </div>
                        </div>

                        {/* 4 Column Row */}
                        <div className="four-col-grid">
                            <div className="form-group">
                                <label>Expense Date <span className="req">*</span></label>
                                <div className="input-with-icon-left">
                                    <Calendar size={18} className="input-icon" />
                                    <input type="date" name="expenseDate" value={formData.expenseDate} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Select PG <span className="req">*</span></label>
                                <div className="input-with-icon-left">
                                    <Building size={18} className="input-icon" />
                                    <select name="pgId" value={formData.pgId} onChange={handleChange} className="with-right-icon">
                                        <option value="">Select PG</option>
                                        {pgs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="right-icon" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Payment Status <span className="req">*</span></label>
                                <div className="input-with-icon-left">
                                    <CreditCard size={18} className="input-icon" />
                                    <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="with-right-icon">
                                        <option value="PAID">Paid</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="PARTIALLY_PAID">Partially Paid</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                    <ChevronDown size={16} className="right-icon" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Payment Date {formData.paymentStatus === 'PAID' && <span className="req">*</span>}</label>
                                <div className="input-with-icon-left">
                                    <Calendar size={18} className="input-icon" />
                                    <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} disabled={formData.paymentStatus === 'CANCELLED'} />
                                </div>
                            </div>
                        </div>

                        {/* Expense Type Row */}
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label>Expense Type <span className="req">*</span></label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input type="radio" checked={formData.expenseType === 'ONE_TIME'} onChange={() => handleExpenseTypeToggle('ONE_TIME')} /> One-Time
                                    </label>
                                    <label className="radio-label">
                                        <input type="radio" checked={formData.expenseType === 'RECURRING'} onChange={() => handleExpenseTypeToggle('RECURRING')} /> Recurring
                                    </label>
                                </div>
                            </div>
                            
                            {formData.expenseType === 'RECURRING' && (
                                <>
                                    <div className="form-group">
                                        <label>Frequency <span className="req">*</span></label>
                                        <div className="input-no-icon">
                                            <select name="frequency" value={formData.frequency} onChange={handleChange}>
                                                <option value="">Select frequency</option>
                                                <option value="WEEKLY">Weekly</option>
                                                <option value="MONTHLY">Monthly</option>
                                                <option value="QUARTERLY">Quarterly</option>
                                                <option value="HALF_YEARLY">Half-Yearly</option>
                                                <option value="YEARLY">Yearly</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Next Due Date <span className="req">*</span></label>
                                        <div className="input-no-icon">
                                            <input type="date" name="nextDueDate" value={formData.nextDueDate} onChange={handleChange} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Line Items Box */}
                        <div className="line-items-box">
                            <h4>Line Items</h4>
                            {items.map((item, index) => (
                                <div className="line-item-row" key={index}>
                                    <div className="form-group">
                                        <label>Category <span className="req">*</span></label>
                                        <div className="input-with-icon-left">
                                            <Grid size={18} className="input-icon" />
                                            <select value={item.category} onChange={(e) => handleItemChange(index, 'category', e.target.value)}>
                                                <option value="">Select category</option>
                                                {ExpenseCategories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount (₹) <span className="req">*</span></label>
                                        <div className="input-with-icon-left">
                                            <span className="input-icon" style={{ fontSize: '16px', fontWeight: 'bold' }}>₹</span>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="Enter amount" 
                                                value={item.amount} 
                                                onChange={(e) => handleItemChange(index, 'amount', e.target.value)} 
                                                onWheel={(e) => e.target.blur()} 
                                                onKeyDown={(e) => {
                                                    if (['e', 'E', '+', '-'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {items.length > 1 && (
                                        <div className="form-group">
                                            <label style={{ visibility: 'hidden' }}>Remove</label>
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(index)}
                                                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', height: '100%', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Remove Item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={addItem}
                                className="add-line-item-btn"
                            >
                                + Add Category / Line Item
                            </button>
                        </div>
                        {/* File Upload Box */}
                        <div className="form-group upload-box-wrapper">
                            <label>Attach Bill / Receipt</label>
                            <div className="upload-box">
                                <input type="file" className="file-input-hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                                <div className="upload-icon-circle">
                                    <UploadCloud size={24} />
                                </div>
                                <p>Drag & drop your file here or <span>click to browse</span></p>
                                <p className="file-hint">JPG, PNG, PDF up to 5MB</p>
                                {receiptFile && <div className="file-name-uploaded">{receiptFile.name}</div>}
                            </div>
                        </div>

                        {/* Advanced Toggle */}
                        <div className="advanced-toggle">
                            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
                                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"} <ChevronDown size={16} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0)' }} />
                            </button>
                        </div>

                        {showAdvanced && (
                            <>
                                <div className="form-grid-2">
                                    {/* Building / Room */}
                                    <div className="form-group">
                                        <label>Building / Block</label>
                                        <div className="input-no-icon">
                                            <select name="buildingId" value={formData.buildingId} onChange={handleChange} disabled={!formData.pgId}>
                                                <option value="">Select building or block</option>
                                                {buildings.map(b => <option key={b.id} value={b.id}>Floor {b.floorNumber}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Room</label>
                                        <div className="input-no-icon">
                                            <select name="roomId" value={formData.roomId} onChange={handleChange} disabled={!formData.buildingId}>
                                                <option value="">Select room</option>
                                                {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid-3">
                                    {/* Vendor & Tax Details */}
                                    <div className="form-group">
                                        <label>Paid To (Vendor / Person)</label>
                                        <div className="input-no-icon">
                                            <input type="text" name="paidTo" placeholder="Enter vendor name" value={formData.paidTo} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Payment Method</label>
                                        <div className="input-no-icon">
                                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                                                <option value="">Select payment method</option>
                                                {PaymentMethods.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Bill / Invoice Number</label>
                                        <div className="input-no-icon">
                                            <input type="text" name="invoiceNumber" placeholder="Enter invoice number" value={formData.invoiceNumber} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description / Notes</label>
                                    <div className="input-no-icon">
                                        <textarea name="description" placeholder="Enter description or notes (optional)" value={formData.description} onChange={handleChange} rows="2" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="unified-footer">
                        <button className="btn-cancel" onClick={() => navigate('/owner/ownerRevenue')} disabled={loading}>Cancel</button>
                        <div className="footer-right-actions">
                            {/* Option to just save */}
                            {/* <button className="btn-save-only" onClick={() => submitExpense(false)} disabled={loading}>Save Only</button> */}
                            <button className="btn-save-another" onClick={() => submitExpense(true)} disabled={loading}>
                                <span className="circle-plus">+</span> Save & Add Another
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddExpense;
