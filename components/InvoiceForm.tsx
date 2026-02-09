import React, { useState, useMemo, useEffect } from 'react';
import { 
  Invoice, 
  Client, 
  UserBusinessProfile, 
  LineItem, 
  InvoiceStatus,
  CustomField,
  AdditionalCharge
} from '../types';
import { CRAFT_DADDY_LOGO_SVG } from '../constants';
import { calculateLineItem, numberToWords, formatCurrency } from '../services/Calculations';

interface InvoiceFormProps {
  userProfile: UserBusinessProfile;
  clients: Client[];
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  initialData?: Invoice;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ userProfile, clients, onSave, onCancel, initialData }) => {
  const [invoice, setInvoice] = useState<Invoice>(() => {
    const baseInvoice = initialData ? { ...initialData } : {
      id: `inv-${Date.now()}`,
      number: `CD${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 99999)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      poNumber: '',
      status: InvoiceStatus.DRAFT,
      clientId: clients[0]?.id || '',
      items: [
        { id: '1', description: 'REFLECTIVE JACKET', hsn: '6210', qty: 225, rate: 100, taxRate: 5 },
      ],
      placeOfSupply: 'Delhi (07)',
      bankDetails: userProfile.bankAccounts[0],
      notes: '',
      terms: '1. For questions concerning this invoice, please contact Email Address : sales@craftdaddy.in\n2. All the dispute are subject to delhi jurisdiction only',
      customFields: [],
      discountType: 'fixed',
      discountValue: 0,
      additionalCharges: [],
      roundOff: 0
    };

    if (!baseInvoice.bankDetails && userProfile.bankAccounts.length > 0) {
      baseInvoice.bankDetails = userProfile.bankAccounts[0];
    }

    if (!baseInvoice.customFields || baseInvoice.customFields.length === 0) {
      baseInvoice.customFields = [
         { label: 'P.O. Number', value: baseInvoice.poNumber || '' }
      ];
    }

    return baseInvoice as Invoice;
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
  const [showDiscount, setShowDiscount] = useState(false);
  
  useEffect(() => {
    if (invoice.discountValue && invoice.discountValue > 0) {
        setShowDiscount(true);
    }
  }, [invoice.discountValue]);

  const selectedClient = useMemo(() => clients.find(c => c.id === invoice.clientId), [clients, invoice.clientId]);
  
  const isInterState = useMemo(() => {
    const supplyStateCode = invoice.placeOfSupply.match(/\((\d+)\)/)?.[1];
    return supplyStateCode && supplyStateCode !== userProfile.address.stateCode;
  }, [invoice.placeOfSupply, userProfile.address.stateCode]);

  const totals = useMemo(() => {
    const itemTotals = (invoice.items || []).reduce((acc, item) => {
      const calc = calculateLineItem(item, !!isInterState);
      return {
        taxable: acc.taxable + calc.taxableValue,
        cgst: acc.cgst + calc.cgst,
        sgst: acc.sgst + calc.sgst,
        igst: acc.igst + calc.igst,
        total: acc.total + calc.total
      };
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

    let discountAmount = 0;
    if (invoice.discountValue) {
      if (invoice.discountType === 'percentage') {
        discountAmount = (itemTotals.taxable * invoice.discountValue) / 100;
      } else {
        discountAmount = invoice.discountValue;
      }
    }

    const additionalChargesTotal = (invoice.additionalCharges || []).reduce((sum, charge) => sum + (charge.amount || 0), 0);
    const preRoundTotal = itemTotals.total - discountAmount + additionalChargesTotal;
    const finalTotal = preRoundTotal + (invoice.roundOff || 0);

    return {
      ...itemTotals,
      discountAmount,
      additionalChargesTotal,
      preRoundTotal,
      finalTotal
    };
  }, [invoice.items, isInterState, invoice.discountType, invoice.discountValue, invoice.additionalCharges, invoice.roundOff]);

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }]
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) return;
    setInvoice(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const addCustomField = () => {
    setInvoice(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), { label: '', value: '' }]
    }));
  };

  const updateCustomField = (index: number, field: keyof CustomField, value: string) => {
    const newFields = [...(invoice.customFields || [])];
    newFields[index] = { ...newFields[index], [field]: value };
    setInvoice({ ...invoice, customFields: newFields });
  };

  const removeCustomField = (index: number) => {
    const newFields = [...(invoice.customFields || [])];
    newFields.splice(index, 1);
    setInvoice({ ...invoice, customFields: newFields });
  };

  const addAdditionalCharge = () => {
    setInvoice(prev => ({
      ...prev,
      additionalCharges: [...(prev.additionalCharges || []), { id: Date.now().toString(), label: '', amount: 0 }]
    }));
  };

  const updateAdditionalCharge = (id: string, field: keyof AdditionalCharge, value: any) => {
    setInvoice(prev => ({
      ...prev,
      additionalCharges: (prev.additionalCharges || []).map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeAdditionalCharge = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      additionalCharges: (prev.additionalCharges || []).filter(c => c.id !== id)
    }));
  };

  const handleRoundUp = () => {
    const current = totals.preRoundTotal;
    const target = Math.ceil(current);
    const diff = target - current;
    setInvoice({ ...invoice, roundOff: diff });
  };

  const handleRoundDown = () => {
    const current = totals.preRoundTotal;
    const target = Math.floor(current);
    const diff = target - current;
    setInvoice({ ...invoice, roundOff: diff });
  };

  const handlePrint = () => {
    if (window) {
        window.focus();
        setTimeout(() => {
            window.print();
        }, 100);
    }
  };

  const GRID_COLS = "grid-cols-[20px_minmax(0,2fr)_minmax(60px,0.5fr)_minmax(50px,0.4fr)_minmax(50px,0.4fr)_minmax(60px,0.5fr)_minmax(80px,0.7fr)_minmax(50px,0.4fr)_minmax(50px,0.4fr)_minmax(80px,0.7fr)]";

  return (
    <div className="min-h-screen bg-gray-50 pb-32 relative font-sans text-sm text-gray-700">
      
      {/* =====================================================================================
          EDITOR VIEW (Visible on Screen, Hidden on Print)
         ===================================================================================== */}
      <div className="print:hidden">
        {/* Top Navigation - Sticky for better UX */}
        <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all">
            <div className="max-w-6xl mx-auto py-4 px-4 flex justify-between items-center">
              <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition group">
                  <div className="bg-white p-1.5 rounded-full border border-gray-200 group-hover:border-gray-400 transition shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </div>
                  <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="flex gap-3">
                  {/* Primary Action Button for Printing */}
                  <button 
                      type="button"
                      onClick={handlePrint} 
                      className="bg-indigo-600 text-white border border-transparent px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 flex items-center gap-2 transition transform"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Print / Save PDF
                  </button>
              </div>
            </div>
        </div>

        {/* Main Editor Document */}
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-8 md:p-12 mb-8 mt-6 relative">
          {/* Header */}
          <div className="flex flex-col items-center mb-10 group relative">
              <div className="flex items-center gap-2 border-b-2 border-dashed border-gray-300 pb-1 mb-1 hover:border-gray-400 transition">
                <h1 className="text-3xl font-extrabold text-gray-900 cursor-text">Tax Invoice</h1>
              </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
              {/* Left Info Fields */}
              <div className="flex-1 space-y-5 max-w-sm">
                <div className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                    <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">Invoice No<span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={invoice.number} 
                      onChange={(e) => setInvoice({...invoice, number: e.target.value})}
                      className="w-full font-bold text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent"
                    />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">Invoice Date<span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      required
                      value={invoice.date} 
                      onChange={(e) => setInvoice({...invoice, date: e.target.value})}
                      className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent cursor-pointer"
                      onClick={(e) => e.currentTarget.showPicker()}
                    />
                </div>

                {/* Custom Fields (PO Number etc) */}
                {invoice.customFields?.map((field, index) => (
                    <div key={index} className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                      <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                          className="text-gray-500 font-semibold bg-transparent outline-none border-b border-transparent focus:border-indigo-600 placeholder-gray-400 text-right pr-2"
                          placeholder="Label"
                      />
                      <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={field.value} 
                            onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                            className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 bg-transparent"
                            placeholder="Value"
                          />
                          <button onClick={() => removeCustomField(index)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-1">×</button>
                      </div>
                    </div>
                ))}
                
                <button 
                    onClick={addCustomField}
                    className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1 mt-2 transition"
                >
                    <span className="text-lg leading-none">+</span> Add Custom Fields
                </button>
              </div>

              {/* Right Logo Area */}
              <div className="w-full md:w-72 flex flex-col items-center">
                <div className="w-full h-32 border border-gray-100 rounded-lg flex items-center justify-center p-4 relative group bg-white shadow-sm hover:shadow-md transition">
                    <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-h-full max-w-full object-contain" alt="Logo" />
                </div>
              </div>
          </div>

          {/* Billed By / Billed To Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Billed By */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm transition duration-300">
                <div className="px-5 py-3 border-b border-gray-100 bg-white">
                    <h3 className="text-gray-800 font-bold text-base">Billed By</h3>
                </div>
                <div className="p-5 flex-1 bg-white">
                    <div className="mb-4">
                      <select className="border border-gray-200 rounded-md w-full p-2 bg-gray-50/50 text-sm">
                          <option>{userProfile.companyName}</option>
                      </select>
                    </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm transition duration-300">
                <div className="px-5 py-3 border-b border-gray-100 bg-white">
                    <h3 className="text-gray-800 font-bold text-base">Billed To</h3>
                </div>
                <div className="p-5 flex-1 bg-white">
                    <div className="mb-4">
                      <select 
                          className="border border-gray-200 rounded-md w-full p-2 bg-white text-sm"
                          value={invoice.clientId}
                          onChange={(e) => setInvoice({...invoice, clientId: e.target.value})}
                      >
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                </div>
              </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-4 rounded-t-lg border border-gray-200 overflow-hidden">
              <div className="min-w-full">
                  <div className={`bg-[#8b5cf6] text-white text-xs font-bold py-3 px-3 grid ${GRID_COLS} gap-2 items-center rounded-t-lg`}>
                    <div>#</div>
                    <div>Item</div>
                    <div className="text-left pl-1">HSN/SAC</div>
                    <div className="text-left">GST Rate</div>
                    <div className="text-left">Quantity</div>
                    <div className="text-left">Rate</div>
                    <div className="text-left">Amount</div>
                    <div className="text-left">CGST</div>
                    <div className="text-left">SGST</div>
                    <div className="text-left">Total</div>
                  </div>

                  {invoice.items.map((item, idx) => {
                    const calc = calculateLineItem(item, !!isInterState);
                    return (
                        <div key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition group">
                          <div className={`py-4 px-3 grid ${GRID_COLS} gap-2 items-start text-xs text-gray-800`}>
                              <div className="font-bold pt-2 text-base">{idx + 1}.</div>
                              <div className="space-y-3">
                                <div className="relative">
                                    <input 
                                      type="text" 
                                      className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none pb-1 font-medium placeholder-gray-400 text-gray-900 text-sm"
                                      value={item.description}
                                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                                      placeholder="Item Name"
                                    />
                                    <button onClick={() => removeItem(item.id)} className="absolute right-0 top-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">×</button>
                                </div>
                              </div>
                              <div className="pt-1">
                                  <input 
                                    type="text" 
                                    className="w-full text-left pl-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                                    value={item.hsn}
                                    onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                                  />
                              </div>
                              <div className="pt-1">
                                  <input 
                                    type="number"
                                    className="w-full bg-transparent border-none outline-none text-left"
                                    value={item.taxRate}
                                    onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value))}
                                  />
                              </div>
                              <div className="pt-1">
                                  <input 
                                    type="number" 
                                    className="w-full text-left bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                                    value={item.qty}
                                    onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))}
                                  />
                              </div>
                              <div className="pt-1">
                                  <input 
                                    type="number" 
                                    className="w-full text-left bg-transparent border-none outline-none"
                                    value={item.rate}
                                    onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                                  />
                              </div>
                              <div className="pt-1 text-left font-medium">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                              <div className="pt-1 text-left text-gray-500">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                              <div className="pt-1 text-left text-gray-500">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                              <div className="pt-1 text-left font-bold text-gray-900">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                          </div>
                        </div>
                    );
                  })}
              </div>
          </div>

          <button 
              onClick={addItem}
              className="mb-8 border border-dashed border-indigo-400 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 transition"
          >
              <span className="text-lg leading-none">+</span> Add New Line
          </button>
          
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <button 
                onClick={() => onSave(invoice)}
                className="bg-[#E91E63] text-white px-12 py-3 rounded-md font-bold text-sm shadow-lg hover:bg-[#D81B60] transform hover:-translate-y-0.5 transition duration-200"
            >
                Save & Continue
            </button>
          </div>
        </div>
      </div>


      {/* =====================================================================================
          PRINT VIEW (Hidden on Screen, Visible on Print)
          Uses exact specific styling from the Craft Daddy reference image
         ===================================================================================== */}
      <div id="print-view" className="hidden print:block bg-white text-black p-0 m-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col gap-1">
                  <h1 className="text-4xl font-medium text-[#5c2c90] mb-4">Tax Invoice</h1>
                  <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                      <span className="text-gray-500 font-medium">Invoice No #</span>
                      <span className="font-bold text-gray-900">{invoice.number}</span>
                      
                      <span className="text-gray-500 font-medium">Invoice Date</span>
                      <span className="font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                      
                      {invoice.customFields?.map((field, i) => (
                          <React.Fragment key={i}>
                              <span className="text-gray-500 font-medium">{field.label}</span>
                              <span className="font-bold text-gray-900">{field.value}</span>
                          </React.Fragment>
                      ))}
                  </div>
              </div>
              <div className="w-64">
                  <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-w-full object-contain" alt="Logo" />
              </div>
          </div>

          {/* Billing Boxes */}
          <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Billed By */}
              <div className="bg-[#f8f5ff] p-4 rounded-sm">
                  <h3 className="text-[#5c2c90] font-bold text-lg mb-2">Billed By</h3>
                  <div className="text-sm space-y-1 text-gray-800">
                      <p className="font-bold">{userProfile.companyName}</p>
                      <p className="whitespace-pre-line">{userProfile.address.street},</p>
                      <p>{userProfile.address.city},</p>
                      <p>{userProfile.address.state}, {userProfile.address.country} - {userProfile.address.pincode}</p>
                      <p className="mt-2"><span className="font-bold">GSTIN:</span> <span className="text-[#5c2c90]">{userProfile.gstin}</span></p>
                      <p><span className="font-bold">PAN:</span> {userProfile.pan}</p>
                  </div>
              </div>
              
              {/* Billed To */}
              <div className="bg-[#f8f5ff] p-4 rounded-sm">
                  <h3 className="text-[#5c2c90] font-bold text-lg mb-2">Billed To</h3>
                  <div className="text-sm space-y-1 text-gray-800">
                      <p className="font-bold uppercase">{selectedClient?.name}</p>
                      <p className="uppercase">{selectedClient?.address.street},</p>
                      <p className="uppercase">{selectedClient?.address.city}, {selectedClient?.address.state},</p>
                      <p className="uppercase">{selectedClient?.address.country} - {selectedClient?.address.pincode}</p>
                      <p className="mt-2"><span className="font-bold">GSTIN:</span> <span className="text-[#5c2c90]">{selectedClient?.gstin || 'N/A'}</span></p>
                      <p><span className="font-bold">PAN:</span> {selectedClient?.pan || 'N/A'}</p>
                  </div>
              </div>
          </div>

          {/* Supply Place */}
          <div className="flex justify-between items-center px-4 mb-4 text-sm">
             <div>Country of Supply: <span className="font-bold text-gray-900">India</span></div>
             <div>Place of Supply: <span className="font-bold text-[#5c2c90]">{invoice.placeOfSupply}</span></div>
          </div>

          {/* Table */}
          <table className="w-full mb-6">
              <thead className="bg-[#5c2c90] text-white">
                  <tr>
                      <th className="py-2 px-3 text-left text-sm font-medium">Item</th>
                      <th className="py-2 px-3 text-center text-sm font-medium">GST Rate</th>
                      <th className="py-2 px-3 text-center text-sm font-medium">Quantity</th>
                      <th className="py-2 px-3 text-center text-sm font-medium">Rate</th>
                      <th className="py-2 px-3 text-right text-sm font-medium">Amount</th>
                      <th className="py-2 px-3 text-right text-sm font-medium">CGST</th>
                      <th className="py-2 px-3 text-right text-sm font-medium">SGST</th>
                      <th className="py-2 px-3 text-right text-sm font-medium">Total</th>
                  </tr>
              </thead>
              <tbody className="text-sm">
                  {invoice.items.map((item, idx) => {
                      const calc = calculateLineItem(item, !!isInterState);
                      return (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-3 px-3">
                                  <div className="font-bold text-gray-800 uppercase">{item.description}</div>
                                  <div className="text-xs text-gray-500">(HSN/SAC: {item.hsn})</div>
                              </td>
                              <td className="py-3 px-3 text-center">{item.taxRate}%</td>
                              <td className="py-3 px-3 text-center">{item.qty}</td>
                              <td className="py-3 px-3 text-center">₹{item.rate}</td>
                              <td className="py-3 px-3 text-right">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              <td className="py-3 px-3 text-right">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              <td className="py-3 px-3 text-right">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              <td className="py-3 px-3 text-right font-bold">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>

          {/* Lower Section Grid */}
          <div className="grid grid-cols-[1.4fr_1fr] gap-8 mb-8">
              {/* Left Column: Words + Bank */}
              <div>
                  <div className="mb-6 text-sm">
                      <p className="font-bold mb-1">Total (in words) : <span className="font-medium uppercase">{numberToWords(Math.round(totals.finalTotal))}</span></p>
                  </div>
                  
                  {/* Bank Details Box */}
                  <div className="bg-[#f8f5ff] p-4 rounded-sm">
                      <h3 className="text-[#5c2c90] font-bold mb-3">Bank Details</h3>
                      <div className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                          <span className="font-bold text-gray-700">Account Name</span>
                          <span className="uppercase text-[#5c2c90] font-bold">{invoice.bankDetails?.accountName}</span>

                          <span className="font-bold text-gray-700">Account Number</span>
                          <span className="text-[#5c2c90] font-bold">{invoice.bankDetails?.accountNumber}</span>

                          <span className="font-bold text-gray-700">IFSC</span>
                          <span className="text-[#5c2c90] font-bold">{invoice.bankDetails?.ifscCode}</span>

                          <span className="font-bold text-gray-700">Account Type</span>
                          <span className="text-[#5c2c90] font-bold">{invoice.bankDetails?.accountType}</span>

                          <span className="font-bold text-gray-700">Bank</span>
                          <span className="text-[#5c2c90] font-bold uppercase">{invoice.bankDetails?.bankName}</span>
                      </div>
                  </div>
              </div>

              {/* Right Column: Totals */}
              <div>
                   <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-blue-600">
                          <span>Amount</span>
                          <span>₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-gray-800">
                          <span>CGST</span>
                          <span>₹{totals.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-gray-800">
                          <span>SGST</span>
                          <span>₹{totals.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      
                      {totals.additionalChargesTotal > 0 && (
                          <div className="flex justify-between text-gray-800">
                              <span>Additional Charges</span>
                              <span>₹{totals.additionalChargesTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                      )}
                      
                      {totals.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                              <span>Discount</span>
                              <span>- ₹{totals.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                      )}
                      
                      {invoice.roundOff !== 0 && (
                          <div className="flex justify-between text-gray-500 italic">
                              <span>Round Off</span>
                              <span>{invoice.roundOff > 0 ? '+' : ''} ₹{invoice.roundOff?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                      )}

                      <div className="flex justify-between items-center border-t-2 border-black pt-2 mt-4 text-lg font-bold">
                          <span>Total (INR)</span>
                          <span>₹{totals.finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                   </div>
              </div>
          </div>

          {/* Footer Terms */}
          <div className="mb-12">
              <h4 className="text-[#5c2c90] font-bold mb-2">Terms and Conditions</h4>
              <div className="text-xs text-gray-600 space-y-1">
                 {invoice.terms?.split('\n').map((term, i) => (
                    <p key={i}>{term}</p>
                 ))}
              </div>
          </div>

          {/* Bottom Branding */}
          <div className="flex justify-between items-end text-[10px] text-gray-500 mt-auto">
             <p>This is an electronically generated document, no signature is required.</p>
             <p className="flex items-center gap-1">
                Powered by <span className="font-bold text-[#5c2c90] flex items-center gap-1"><span className="text-lg leading-none">▲</span> Refrens.com</span>
             </p>
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            @page { margin: 10mm; size: A4; }
            
            /* RESET EVERYTHING */
            html, body {
                height: initial !important;
                overflow: initial !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: white;
            }

            /* Hide the main app UI elements explicitly */
            nav, aside, header, .sidebar, .no-print, .sticky, button {
                display: none !important;
            }

            /* Hide everything by default to clear the canvas */
            body > * {
                visibility: hidden;
            }

            /* Make sure the root and app wrappers don't clip the content */
            #root, #root > div {
                height: auto !important;
                overflow: visible !important;
                position: static !important;
            }

            /* Style the specific printable content */
            #print-view {
                visibility: visible !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: white !important;
                z-index: 9999 !important;
                display: block !important;
            }

            /* Make children visible */
            #print-view * {
                visibility: visible !important;
            }
            
            /* Typography adjustments for print */
            body {
                font-size: 12px;
                color: black;
                font-family: sans-serif;
            }
        }
      `}} />
    </div>
  );
};

export default InvoiceForm;