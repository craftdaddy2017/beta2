import React, { useState } from 'react';
import { Invoice, Client, InvoiceStatus } from '../types';
import { formatCurrency } from '../services/Calculations';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  onEdit: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onDelete: (id: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ 
  invoices, 
  clients, 
  onEdit, 
  onDuplicate, 
  onUpdateStatus,
  onDelete 
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const getClient = (id: string) => clients.find(c => c.id === id);

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-emerald-100 text-emerald-700';
      case InvoiceStatus.SENT: return 'bg-blue-100 text-blue-700';
      case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-700';
      case InvoiceStatus.DRAFT: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const client = getClient(inv.clientId);
    const total = inv.items.reduce((sum, item) => sum + (item.qty * item.rate * (1 + item.taxRate / 100)), 0);
    const text = `Hi ${client?.name || 'Customer'},\n\nPlease find the invoice ${inv.number} for the amount of ${formatCurrency(total)}. \n\nRegards,\nCraft Daddy`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = (inv: Invoice) => {
    const client = getClient(inv.clientId);
    const total = inv.items.reduce((sum, item) => sum + (item.qty * item.rate * (1 + item.taxRate / 100)), 0);
    const subject = `Invoice ${inv.number} from Craft Daddy`;
    const body = `Hi ${client?.name || 'Customer'},\n\nPlease find attached the invoice ${inv.number} for ${formatCurrency(total)}.\n\nThank you for your business!`;
    window.location.href = `mailto:${client?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Issued</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifecycle</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => {
              const total = inv.items.reduce((sum, item) => sum + (item.qty * item.rate * (1 + item.taxRate / 100)), 0);
              return (
                <tr key={inv.id} className="hover:bg-gray-50 transition relative">
                  <td className="px-6 py-4 font-bold text-gray-900">{inv.number}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-[150px] font-medium">{getClient(inv.clientId)?.name || 'Unknown Client'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-bold uppercase">{new Date(inv.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</td>
                  <td className="px-6 py-4 font-black text-indigo-700">{formatCurrency(total)}</td>
                  <td className="px-6 py-4">
                    <div className="relative group/status">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(inv.status)} cursor-pointer whitespace-nowrap`}>
                        {inv.status}
                      </span>
                      <div className="hidden group-hover/status:flex absolute left-0 top-full mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl z-50 py-1 min-w-[120px] flex-col overflow-hidden">
                          <button onClick={() => onUpdateStatus(inv.id, InvoiceStatus.PAID)} className="text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-600 font-bold">Mark Paid</button>
                          <button onClick={() => onUpdateStatus(inv.id, InvoiceStatus.SENT)} className="text-left px-4 py-2 text-xs hover:bg-blue-50 text-blue-600 font-bold">Mark Sent</button>
                          <button onClick={() => onUpdateStatus(inv.id, InvoiceStatus.DRAFT)} className="text-left px-4 py-2 text-xs hover:bg-gray-50 text-gray-600 font-bold">Mark Unpaid</button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => onEdit(inv)}
                        className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      
                      <div className="relative group">
                          <button className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                          </button>
                          <div className="hidden group-hover:flex absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 py-2 w-56 flex-col text-left overflow-hidden">
                              <button onClick={() => onDuplicate(inv)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold transition">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                  Duplicate
                              </button>
                              <button onClick={() => onEdit(inv)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold transition">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                  View / Print
                              </button>
                              <div className="h-px bg-gray-100 my-1 mx-2"></div>
                              <button onClick={() => handleShareWhatsApp(inv)} className="flex items-center gap-3 px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 font-bold transition">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.038 3.284l-.569 2.1c-.08.293.18.559.479.498l2.126-.432c.945.483 2.016.75 3.125.75 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zM15.42 14.512c-.157.443-.79.802-1.22.888-.344.068-.788.125-1.272-.034-1.127-.372-2.316-1.577-3.23-2.616-.27-.306-.5-.59-.684-.848-.382-.544-.65-1.157-.315-1.583.104-.131.296-.285.442-.387.112-.078.225-.131.309-.131.085 0 .17.001.24.004.073.003.15.006.216.143.085.18.29.702.315.754.025.05.04.109.008.173-.031.065-.07.106-.144.186l-.216.242c-.068.077-.14.16-.06.297.08.137.354.584.761.947.525.467.967.61 1.104.678.137.069.217.057.297-.034.08-.09.344-.403.435-.54.092-.137.183-.114.306-.068.123.046.779.367.914.435.134.068.223.102.257.16.034.058.034.336-.123.779zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                                  Share WhatsApp
                              </button>
                              <div className="h-px bg-gray-100 my-1 mx-2"></div>
                              <button onClick={() => onDelete(inv.id)} className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-bold transition">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  Delete Permanently
                              </button>
                          </div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">No invoices in directory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;