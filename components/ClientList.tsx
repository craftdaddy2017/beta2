
import React, { useState, useEffect, useMemo } from 'react';
import { Client, Address } from '../types';
import { INDIAN_STATES } from '../constants';

// We only keep the PAN extraction logic for convenience, without strict validation blocks.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface ClientListProps {
  clients: Client[];
  onSave: (client: Client) => void;
  onDelete: (id: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSave, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const initialClient: Client = {
    id: `client-${Date.now()}`,
    name: '',
    email: '',
    gstin: '',
    pan: '',
    address: {
      street: '',
      city: '',
      state: 'Delhi',
      stateCode: '07',
      pincode: '',
      country: 'India'
    }
  };

  const [formData, setFormData] = useState<Client>(initialClient);

  // Auto PAN Extraction (Convenience feature, not validation)
  useEffect(() => {
    if (formData.gstin && formData.gstin.length >= 12) {
      const extractedPan = formData.gstin.substring(2, 12).toUpperCase();
      if (PAN_REGEX.test(extractedPan)) {
        if (formData.pan !== extractedPan) {
          setFormData(prev => ({ ...prev, pan: extractedPan }));
        }
      }
    } else if (!formData.gstin) {
      // Clear PAN if GSTIN is removed and it was likely auto-filled
      if (formData.pan && !editingClient) {
         setFormData(prev => ({ ...prev, pan: '' }));
      }
    }
  }, [formData.gstin]);

  const handleEdit = (client: Client) => {
    setFormData(client);
    setEditingClient(client);
    setShowForm(true);
  };

  const handleAdd = () => {
    setFormData({ ...initialClient, id: `client-${Date.now()}` });
    setEditingClient(null);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowForm(false);
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setFormData({
      ...formData,
      address: { ...formData.address, [field]: value }
    });
  };

  const isFormInvalid = useMemo(() => {
    return !formData.name || !formData.address.street || !formData.address.city || !formData.address.pincode;
  }, [formData]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">Manage your business customers and compliance</p>
        </div>
        {!showForm && (
          <button 
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Client
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-gray-900">{editingClient ? 'Edit Client Profile' : 'New Client Onboarding'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Company / Client Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                  placeholder="e.g. Acme Corporation"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                  placeholder="billing@client.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  GSTIN (Optional)
                </label>
                <input 
                  type="text" 
                  maxLength={15}
                  placeholder="e.g. 07AAAAA0000A1Z1"
                  className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 transition border-gray-100 uppercase font-mono text-sm focus:ring-indigo-500"
                  value={formData.gstin}
                  onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  PAN (Auto-filled)
                </label>
                <input 
                  readOnly
                  type="text" 
                  className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 outline-none cursor-not-allowed border-gray-100 uppercase font-mono text-sm"
                  value={formData.pan}
                  placeholder="Derived from GSTIN"
                />
              </div>

              <div className="col-span-2 border-t border-gray-100 pt-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Registered Office Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Street Address</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                      value={formData.address.street}
                      onChange={e => updateAddress('street', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">City</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                      value={formData.address.city}
                      onChange={e => updateAddress('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">State</label>
                    <select 
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                      value={formData.address.stateCode}
                      onChange={e => {
                        const state = INDIAN_STATES.find(s => s.code === e.target.value);
                        if (state) {
                          setFormData({
                            ...formData,
                            address: { ...formData.address, state: state.name, stateCode: state.code }
                          });
                        }
                      }}
                    >
                      {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pincode</label>
                    <input 
                      required
                      type="text" 
                      maxLength={6}
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-mono"
                      value={formData.address.pincode}
                      onChange={e => updateAddress('pincode', e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Country</label>
                    <input 
                      readOnly
                      type="text" 
                      className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 outline-none cursor-not-allowed border-gray-100"
                      value={formData.address.country}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isFormInvalid}
                className={`flex-1 py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                  isFormInvalid 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {editingClient ? 'Update Client' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Point</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance (GSTIN/PAN)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50/50 transition group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{client.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{client.address.city}, {client.address.state}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-600 font-medium">{client.email || <span className="text-gray-300 italic">No email provided</span>}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter w-8">GSTIN</span>
                        <span className="text-xs font-mono font-bold text-indigo-700">{client.gstin || '---'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter w-8">PAN</span>
                        <span className="text-xs font-mono font-medium text-gray-500">{client.pan || '---'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(client)} 
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Client"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button 
                        onClick={() => onDelete(client.id)} 
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                        title="Delete Client"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <p className="font-black text-xs uppercase tracking-widest text-gray-500">No customers in your directory</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientList;
