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
import { calculateLineItem, numberToWords } from '../services/Calculations';

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
        { id: '1', description: 'Safety Shoes', hsn: '6401', qty: 78, rate: 260, taxRate: 5 },
        { id: '2', description: 'Jacket S/G', hsn: '9989', qty: 14, rate: 650, taxRate: 5 },
        { id: '3', description: 'Socks', hsn: '6115', qty: 50, rate: 30, taxRate: 5 }
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

    if (!baseInvoice.discountType) {
        baseInvoice.discountType = 'fixed';
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
    // Focus ensures that the print dialog captures the correct window context
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
      {/* Top Navigation - Sticky for better UX */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all no-print">
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

      {/* Main Document */}
      <div 
        id="printable-content" 
        className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-8 md:p-12 mb-8 mt-6 relative print:shadow-none print:w-full print:max-w-none print:p-0 print:mt-0"
      >
         {/* 1. Header Section */}
         <div className="flex flex-col items-center mb-10 group relative">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-gray-300 pb-1 mb-1 hover:border-gray-400 transition">
              <h1 className="text-3xl font-extrabold text-gray-900 cursor-text">Tax Invoice</h1>
              <svg className="w-4 h-4 text-gray-400 cursor-pointer no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </div>
            <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:text-indigo-800 transition no-print">
               <span className="text-lg leading-none">+</span> Add Subtitle
            </button>
         </div>

         <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            {/* Left Info Fields */}
            <div className="flex-1 space-y-5 max-w-sm">
               <div className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                  <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">Invoice No<span className="text-red-500">*</span></label>
                  <div>
                     <input 
                        type="text" 
                        value={invoice.number} 
                        onChange={(e) => setInvoice({...invoice, number: e.target.value})}
                        className="w-full font-bold text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent no-print"
                     />
                     <div className="print-only font-bold text-gray-900 py-1">{invoice.number}</div>
                     <div className="text-[10px] text-gray-400 mt-1 no-print">Last No: CD{(parseInt(invoice.number.replace(/\D/g,''))-1).toString()}</div>
                  </div>
               </div>

               <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                  <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">Invoice Date<span className="text-red-500">*</span></label>
                  <div className="relative">
                     <input 
                        type="date" 
                        required
                        value={invoice.date} 
                        onChange={(e) => setInvoice({...invoice, date: e.target.value})}
                        className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent cursor-pointer no-print"
                        onClick={(e) => e.currentTarget.showPicker()}
                     />
                     <div className="print-only font-medium text-gray-900 py-1">
                        {new Date(invoice.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                     </div>
                  </div>
               </div>

               {/* Due Date */}
               <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                  <label className="text-gray-500 font-semibold">Due Date</label>
                  <div className="relative">
                     <input 
                        type="date" 
                        value={invoice.dueDate} 
                        onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})}
                        className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent cursor-pointer no-print"
                        placeholder="Optional"
                        onClick={(e) => e.currentTarget.showPicker()}
                     />
                     <div className="print-only font-medium text-gray-900 py-1">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}) : ''}
                     </div>
                  </div>
               </div>

               {/* Custom Fields */}
               {invoice.customFields?.map((field, index) => (
                  <div key={index} className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                     <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                        className="text-gray-500 font-semibold bg-transparent outline-none border-b border-transparent focus:border-indigo-600 placeholder-gray-400 text-right pr-2 no-print"
                        placeholder="Label"
                     />
                     <div className="print-only text-right pr-2 font-semibold text-gray-500">{field.label}</div>
                     
                     <div className="flex items-center gap-2">
                        <input 
                           type="text" 
                           value={field.value} 
                           onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                           className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 bg-transparent no-print"
                           placeholder="Value"
                        />
                        <div className="print-only font-medium text-gray-900 py-1">{field.value}</div>
                        <button onClick={() => removeCustomField(index)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-1 no-print">×</button>
                     </div>
                  </div>
               ))}
               
               <button 
                  onClick={addCustomField}
                  className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1 mt-2 no-print transition"
               >
                  <span className="text-lg leading-none">+</span> Add Custom Fields
               </button>
            </div>

            {/* Right Logo Area */}
            <div className="w-full md:w-72 flex flex-col items-center">
               <div className="w-full h-32 border border-gray-100 rounded-lg flex items-center justify-center p-4 relative group bg-white shadow-sm hover:shadow-md transition">
                  <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-h-full max-w-full object-contain" alt="Logo" />
               </div>
               <div className="flex gap-4 mt-2 no-print">
                  <button className="text-gray-400 text-xs hover:text-red-500 flex items-center gap-1 transition">✕ Remove</button>
                  <button className="text-indigo-600 text-xs hover:text-indigo-800 flex items-center gap-1 transition">✎ change</button>
               </div>
            </div>
         </div>

         {/* 2. Billed By / Billed To Sections */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Billed By */}
            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm transition duration-300 print:border-gray-200">
               <div className="px-5 py-3 border-b border-gray-100 bg-white">
                  <h3 className="text-gray-800 font-bold text-base flex items-center gap-2 border-b-2 border-dotted border-gray-300 pb-0.5 inline-block">
                     Billed By <span className="text-gray-400 font-normal text-xs ml-1 no-underline border-none">Your Details</span>
                  </h3>
               </div>
               <div className="p-5 flex-1 bg-white">
                  <div className="mb-4 no-print">
                     <div className="border border-gray-200 rounded-md flex items-center px-3 py-2 bg-gray-50/50">
                        <span className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] mr-2 font-bold text-gray-600">CD</span>
                        <select className="bg-transparent outline-none flex-1 font-medium text-gray-700 appearance-none text-sm">
                           <option>{userProfile.companyName}</option>
                        </select>
                     </div>
                  </div>
                  
                  {/* Print Only Title for Billed By */}
                  <div className="print-only text-sm font-bold text-gray-900 mb-2">{userProfile.companyName}</div>

                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-xs">
                     <span className="text-gray-500">Address</span>
                     <span className="text-gray-900 leading-relaxed">
                        {userProfile.address.street}, {userProfile.address.city}, {userProfile.address.state} - {userProfile.address.pincode}
                     </span>
                     <span className="text-gray-500">GSTIN</span>
                     <span className="text-gray-900 font-mono">{userProfile.gstin}</span>
                     <span className="text-gray-500">PAN</span>
                     <span className="text-gray-900 font-mono">{userProfile.pan}</span>
                  </div>
               </div>
            </div>

            {/* Billed To */}
            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm transition duration-300">
               <div className="px-5 py-3 border-b border-gray-100 bg-white">
                  <h3 className="text-gray-800 font-bold text-base flex items-center gap-2 border-b-2 border-dotted border-gray-300 pb-0.5 inline-block">
                     Billed To <span className="text-gray-400 font-normal text-xs ml-1 border-none">Client's Details</span>
                  </h3>
               </div>
               <div className="p-5 flex-1 bg-white">
                  <div className="mb-4 no-print">
                     <div className="border border-gray-200 rounded-md flex items-center px-3 py-2 bg-white hover:border-indigo-300 transition">
                        <select 
                           className="bg-transparent outline-none flex-1 font-medium text-gray-700 w-full text-sm"
                           value={invoice.clientId}
                           onChange={(e) => setInvoice({...invoice, clientId: e.target.value})}
                        >
                           {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                  </div>
                  
                  {/* Print Only Title for Client */}
                  <div className="print-only text-sm font-bold text-gray-900 mb-2">{selectedClient?.name}</div>

                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-xs">
                     <span className="text-gray-500">Address</span>
                     <span className="text-gray-900 leading-relaxed uppercase">
                        {selectedClient?.address.street || '---'} {selectedClient?.address.city}, {selectedClient?.address.state}, India - {selectedClient?.address.pincode}
                     </span>
                     <span className="text-gray-500">GSTIN</span>
                     <span className="text-gray-900 font-mono">{selectedClient?.gstin || '---'}</span>
                     <span className="text-gray-500">PAN</span>
                     <span className="text-gray-900 font-mono">{selectedClient?.pan || '---'}</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="mb-6 flex items-center gap-2 no-print ml-1">
            <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="text-gray-600 text-xs font-medium">Add Shipping Details</span>
         </div>

         <div className="flex flex-wrap items-center gap-3 mb-4 no-print">
            <div className="relative group flex items-center">
                <span className="text-red-500 text-xs mr-1">*</span>
                <span className="text-gray-500 text-xs font-medium mr-2">Currency</span>
            </div>
            <div className="border border-gray-300 rounded px-3 py-1.5 bg-white text-xs font-bold text-gray-700 flex items-center gap-2 cursor-pointer hover:border-gray-400 transition">
               Indian Rupee(INR, ₹)
            </div>
            <button className="border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-50 transition flex items-center gap-1">
               % Configure GST
            </button>
            <div className="ml-auto flex gap-2">
               <button className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50 transition">
                  <span className="text-indigo-600 font-bold mr-1">123</span> Number and Currency Format
               </button>
               <button className="border border-purple-200 text-purple-600 bg-purple-50 px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-100 flex items-center gap-1 transition">
                  Edit Columns/Formulas
               </button>
            </div>
         </div>

         {/* 4. Line Items Table */}
         <div className="mb-4 rounded-t-lg border border-gray-200 overflow-hidden">
             <div className="min-w-full">
                {/* Header */}
                <div className={`bg-[#8b5cf6] text-white text-xs font-bold py-3 px-3 grid ${GRID_COLS} gap-2 items-center rounded-t-lg print:bg-gray-100 print:text-black print:border-b print:border-gray-300`}>
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

                {/* Rows */}
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
                                     className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none pb-1 font-medium placeholder-gray-400 text-gray-900 text-sm no-print"
                                     value={item.description}
                                     onChange={e => updateItem(item.id, 'description', e.target.value)}
                                     placeholder="Item Name"
                                  />
                                  <div className="print-only text-sm font-medium text-gray-900">{item.description}</div>
                                  <button onClick={() => removeItem(item.id)} className="absolute right-0 top-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition no-print">×</button>
                               </div>
                               <div className="flex gap-4 no-print">
                                  <button className="text-indigo-600 text-xs hover:underline flex items-center gap-1 border border-indigo-100 px-2 py-1 rounded bg-indigo-50/50">
                                     <span className="text-sm leading-none">+</span> Add Description
                                  </button>
                                  <button className="text-indigo-600 text-xs hover:underline flex items-center gap-1 border border-indigo-100 px-2 py-1 rounded bg-indigo-50/50">
                                     Add Image
                                  </button>
                               </div>
                            </div>
                            <div className="pt-1 flex items-center gap-1">
                                <input 
                                  type="text" 
                                  className="w-full text-left pl-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors no-print"
                                  value={item.hsn}
                                  onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                               />
                               <div className="print-only pl-1">{item.hsn}</div>
                            </div>
                            <div className="pt-1">
                               <div className="flex items-center border-b border-transparent hover:border-gray-200 focus-within:border-indigo-500">
                                   <input 
                                      type="number"
                                      className="w-full bg-transparent border-none outline-none text-left no-print"
                                      value={item.taxRate}
                                      onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value))}
                                   />
                                   <div className="print-only">{item.taxRate}</div>
                                   <span className="text-gray-400 text-[10px]">%</span>
                               </div>
                            </div>
                            <div className="pt-1">
                               <input 
                                  type="number" 
                                  className="w-full text-left bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors no-print"
                                  value={item.qty}
                                  onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))}
                               />
                               <div className="print-only">{item.qty}</div>
                            </div>
                            <div className="pt-1">
                               <div className="flex items-center border-b border-transparent hover:border-gray-200 focus-within:border-indigo-500">
                                  <span className="text-gray-400 mr-1">₹</span>
                                  <input 
                                     type="number" 
                                     className="w-full text-left bg-transparent border-none outline-none no-print"
                                     value={item.rate}
                                     onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                                  />
                                  <div className="print-only">{item.rate}</div>
                               </div>
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

         {/* Add Buttons */}
         <div className="flex gap-4 mb-8 no-print">
            <button 
               onClick={addItem}
               className="border border-dashed border-indigo-400 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 transition"
            >
               <span className="text-lg leading-none">+</span> Add New Line
            </button>
            <button className="border border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition">
               <span className="text-lg leading-none">+</span> Add New Group <span className="text-[10px] text-orange-500">💎</span>
            </button>
         </div>

         {/* 5. Footer & Totals */}
         <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
            <div className="flex-1"></div>

            <div className="w-full md:w-[450px] bg-gray-50/50 p-6 rounded-xl border border-gray-100 shadow-sm print:bg-transparent print:border-none print:shadow-none">
               <div className="flex justify-between items-center mb-4 no-print">
                  <span className="text-sm font-bold text-gray-800">Show Total in PDF</span>
                  <div className="text-gray-400 hover:text-gray-600 cursor-pointer transition">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
               </div>

               <div className="space-y-3 text-xs text-gray-600 mb-6 border-b border-gray-200 pb-6">
                  <div className="flex justify-between">
                     <span>Amount</span>
                     <span className="font-bold text-gray-900">₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>SGST</span>
                     <span className="font-bold text-gray-900">₹{totals.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>CGST</span>
                     <span className="font-bold text-gray-900">₹{totals.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>

                  {/* Discount Section */}
                  {showDiscount && (
                     <div className="flex justify-between items-center text-emerald-600">
                        <div className="flex items-center gap-2">
                           <span className="font-medium">Discount</span>
                           <select 
                              value={invoice.discountType} 
                              onChange={(e) => setInvoice({...invoice, discountType: e.target.value as 'fixed' | 'percentage'})}
                              className="bg-white border border-gray-300 rounded text-xs px-1 py-0.5 outline-none focus:border-indigo-500 no-print"
                           >
                              <option value="fixed">₹</option>
                              <option value="percentage">%</option>
                           </select>
                           <input 
                              type="number"
                              value={invoice.discountValue}
                              onChange={(e) => setInvoice({...invoice, discountValue: parseFloat(e.target.value) || 0})}
                              className="w-16 border-b border-gray-300 text-right bg-transparent outline-none focus:border-emerald-500 no-print"
                           />
                           <span className="print-only">
                                {invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : `₹${invoice.discountValue}`}
                           </span>
                        </div>
                        <span className="font-bold">- ₹{totals.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                  )}

                  {/* Additional Charges Section */}
                  {(invoice.additionalCharges || []).map((charge) => (
                     <div key={charge.id} className="flex justify-between items-center group/charge">
                        <div className="flex items-center gap-2">
                           <input 
                              type="text"
                              value={charge.label}
                              onChange={(e) => updateAdditionalCharge(charge.id, 'label', e.target.value)}
                              placeholder="Charge Name"
                              className="w-24 bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none text-xs no-print"
                           />
                           <span className="print-only">{charge.label}</span>
                           <button onClick={() => removeAdditionalCharge(charge.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/charge:opacity-100 transition no-print">×</button>
                        </div>
                        <div className="flex items-center gap-1">
                           <span>₹</span>
                           <input 
                              type="number"
                              value={charge.amount}
                              onChange={(e) => updateAdditionalCharge(charge.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none font-bold text-gray-900 no-print"
                           />
                           <span className="print-only">{charge.amount}</span>
                        </div>
                     </div>
                  ))}

                  {/* Round Off Section */}
                  {invoice.roundOff !== 0 && (
                     <div className="flex justify-between text-gray-500 italic">
                        <span>Round Off</span>
                        <span>{invoice.roundOff > 0 ? '+' : ''} ₹{invoice.roundOff?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                  )}
                  
                  <div className="pt-2 flex flex-col gap-3 no-print">
                     {!showDiscount && (
                        <button onClick={() => setShowDiscount(true)} className="text-indigo-600 font-bold hover:underline text-left flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                          Add Discounts ⌵
                        </button>
                     )}
                     <button onClick={addAdditionalCharge} className="text-indigo-600 font-bold hover:underline text-left flex items-center gap-1">
                       <span className="text-lg leading-none">+</span> Add Additional Charges ⌵
                     </button>
                  </div>

                  <div className="flex gap-4 pt-4 no-print">
                     <button onClick={handleRoundUp} className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                       Round Up
                     </button>
                     <button onClick={handleRoundDown} className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                       Round Down
                     </button>
                  </div>
               </div>

               <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-gray-900">Total (INR)</span>
                  <span className="text-2xl font-bold text-gray-900">₹{totals.finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
               </div>
               
               {/* Rest of the footer remains unchanged */}
               <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-[100px_1fr_20px] items-center gap-2">
                     <span className="text-xs font-medium text-gray-600">Advance</span>
                     <input 
                        type="text" 
                        placeholder="Enter value" 
                        className="bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none text-right text-xs py-1 text-gray-900 no-print"
                     />
                     <span className="text-gray-400 cursor-pointer hover:text-red-500 no-print">✕</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr_20px] items-center gap-2">
                     <span className="text-xs font-medium text-gray-600">Balance Amount</span>
                     <input 
                        type="text" 
                        placeholder="Enter value" 
                        className="bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none text-right text-xs py-1 text-gray-900 no-print"
                     />
                     <span className="text-gray-400 cursor-pointer hover:text-red-500 no-print">✕</span>
                  </div>
               </div>
               
               <button className="text-indigo-600 font-bold text-xs hover:underline mt-4 flex items-center gap-1 no-print transition">
                  <span className="text-lg leading-none">+</span> Add Custom Fields
               </button>
            </div>
         </div>
         
         <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold text-gray-800">Show Total In Words</span>
            </div>
            <div className="text-xs text-gray-600 pb-2 border-b-2 border-dashed border-gray-300">
               <span className="font-medium">Total (in words)</span>
               <br/>
               <span className="capitalize">{numberToWords(Math.round(totals.finalTotal))}</span>
            </div>
         </div>

         {/* Bottom Action Area and Terms remain unchanged */}
         <div className="flex flex-wrap gap-4 mb-8 no-print">
             <button className="flex-1 border border-dashed border-indigo-300 text-indigo-700 py-3 rounded-xl font-bold text-xs hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                📄 Add Notes
             </button>
             <button className="flex-1 border border-dashed border-indigo-300 text-indigo-700 py-3 rounded-xl font-bold text-xs hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                📎 Add Attachments
             </button>
             <button className="flex-1 border border-dashed border-indigo-300 text-indigo-700 py-3 rounded-xl font-bold text-xs hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                📞 Add Contact Details
             </button>
         </div>

         <div className="flex justify-end mb-12 no-print">
            <button className="border border-dashed border-indigo-300 text-indigo-700 px-8 py-3 rounded-xl font-bold text-xs hover:bg-indigo-50 flex items-center gap-2 transition">
               🖊 Add Signature
            </button>
         </div>

         <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 mb-8 relative group print:bg-transparent print:border-gray-200">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 no-print transition">✕</button>
            <h4 className="text-sm font-bold text-gray-800 border-b-2 border-dotted border-gray-300 pb-1 mb-4 inline-block">Terms and Conditions</h4>
            <div className="space-y-4">
               {invoice.terms?.split('\n').map((term, i) => (
                  <div key={i} className="flex gap-2 text-xs text-gray-700 group/term">
                     <span className="font-bold text-gray-900">{String(i+1).padStart(2, '0')}</span>
                     <p className="flex-1">{term}</p>
                  </div>
               ))}
            </div>
         </div>

         {/* Additional Info Section with logic for bank details binding */}
         <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 mb-8 relative print:bg-transparent print:border-gray-200">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 no-print transition">✕</button>
            <h4 className="text-sm font-bold text-gray-800 mb-6">Additional Info</h4>
            
            <div className="grid grid-cols-[150px_1fr_20px] gap-y-4 items-center text-xs">
                {/* Bank Details Binding - using defaultValues for now as they are part of userProfile usually selected via modal in real app */}
                <span className="text-gray-600">Bank Name</span>
                <input type="text" className="bg-transparent border-b border-gray-200 outline-none pb-1 focus:border-indigo-600 text-gray-900 no-print" defaultValue={invoice.bankDetails?.bankName} />
                <div className="print-only">{invoice.bankDetails?.bankName}</div>
                <span className="text-gray-400 cursor-pointer hover:text-red-500 no-print">✕</span>

                <span className="text-gray-600">A/c Holder's Name</span>
                <input type="text" className="bg-transparent border-b border-gray-200 outline-none pb-1 focus:border-indigo-600 text-gray-900 no-print" defaultValue={invoice.bankDetails?.accountName} />
                <div className="print-only">{invoice.bankDetails?.accountName}</div>
                <span className="text-gray-400 cursor-pointer hover:text-red-500 no-print">✕</span>

                <span className="text-gray-600">A/c Number</span>
                <input type="text" className="bg-transparent border-b border-gray-200 outline-none pb-1 focus:border-indigo-600 text-gray-900 no-print" defaultValue={invoice.bankDetails?.accountNumber} />
                <div className="print-only">{invoice.bankDetails?.accountNumber}</div>
                <span className="text-gray-400 cursor-pointer hover:text-red-500 no-print">✕</span>

                <span className="text-gray-600">IFSC CODE</span>
                <input type="text" className="bg-transparent border-b border-gray-200 outline-none pb-1 focus:border-indigo-600 text-gray-900 no-print" defaultValue={invoice.bankDetails?.ifscCode} />
                <div className="print-only">{invoice.bankDetails?.ifscCode}</div>
                <span className="text-gray-400 cursor-pointer hover:text-red-500 no-print">✕</span>

                <span className="text-gray-600">BRANCH</span>
                <input type="text" className="bg-transparent border-b border-gray-200 outline-none pb-1 focus:border-indigo-600 text-gray-900 no-print" defaultValue={invoice.bankDetails?.branchName} />
                <div className="print-only">{invoice.bankDetails?.branchName}</div>
                <span className="text-gray-400 cursor-pointer hover:text-red-500 no-print">✕</span>
            </div>
            
            <button className="text-indigo-600 font-bold text-xs hover:underline mt-6 flex items-center gap-1 no-print transition">
               <span className="text-lg leading-none">+</span> Add Custom Fields
            </button>
         </div>

         {/* Advanced Options & Save Button */}
         <div className="border border-gray-200 rounded-xl overflow-hidden mb-8 no-print">
            <div 
               className="bg-gray-50 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
               onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
               <h4 className="text-sm font-bold text-gray-900">Advanced options</h4>
               <svg className={`w-4 h-4 text-gray-500 transform transition ${showAdvancedOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            {showAdvancedOptions && (
               <div className="p-6 space-y-4">
                  <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                     <label className="text-xs text-gray-600">Select HSN column view</label>
                     <select className="border border-gray-300 rounded p-2 text-xs bg-white outline-none focus:border-indigo-500">
                        <option>Default</option>
                     </select>
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] no-print">
         <button 
            onClick={() => onSave(invoice)}
            className="bg-[#E91E63] text-white px-12 py-3 rounded-md font-bold text-sm shadow-lg hover:bg-[#D81B60] transform hover:-translate-y-0.5 transition duration-200"
         >
            Save & Continue
         </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            @page { margin: 10mm; size: A4; }
            
            /* RESET EVERYTHING */
            html, body {
                height: initial !important;
                overflow: initial !important;
                -webkit-print-color-adjust: exact;
                background: white;
            }

            /* Hide the main app UI elements explicitly */
            nav, aside, header, .sidebar, .no-print, .sticky {
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
            #printable-content {
                visibility: visible !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: white !important;
                z-index: 9999 !important;
                box-shadow: none !important;
                border: none !important;
            }

            /* Make children visible */
            #printable-content * {
                visibility: visible !important;
            }

            /* Ensure print-only elements are displayed */
            .print-only {
                display: block !important;
            }
            
            /* Typography adjustments for print */
            body {
                font-size: 12px;
                color: black;
            }
        }
      `}} />
    </div>
  );
};

export default InvoiceForm;