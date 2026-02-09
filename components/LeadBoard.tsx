
import React from 'react';
import { Lead, LeadStatus } from '../types';
import { formatCurrency } from '../services/Calculations';

interface LeadBoardProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const LeadBoard: React.FC<LeadBoardProps> = ({ leads, setLeads }) => {
  const statuses = Object.values(LeadStatus);

  const moveLead = (id: string, newStatus: LeadStatus) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  const deleteLead = (id: string) => {
    if (window.confirm('Delete this lead?')) {
      setLeads(leads.filter(l => l.id !== id));
    }
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10">
         <div>
            <h1 className="text-3xl font-black text-gray-900">CRM Pipeline</h1>
            <p className="text-gray-500 text-sm">Visual tracking for business opportunities</p>
         </div>
         <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Lead
         </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-10 custom-scrollbar">
        {statuses.map(status => (
          <div key={status} className="w-80 flex-shrink-0 flex flex-col h-full bg-gray-100/40 rounded-3xl p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                 <span className={`w-2.5 h-2.5 rounded-full ${status === LeadStatus.WON ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                 {status}
              </h3>
              <span className="text-[10px] bg-white text-gray-400 px-3 py-1 rounded-full font-black shadow-sm border border-gray-50">
                {leads.filter(l => l.status === status).length}
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {leads.filter(l => l.status === status).map(lead => (
                <div key={lead.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-grab group">
                   <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900 leading-tight">{lead.company}</p>
                      <button 
                        onClick={() => deleteLead(lead.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                   <p className="text-xs text-gray-400 font-medium mb-4">{lead.name}</p>
                   <div className="flex justify-between items-center">
                      <p className="text-indigo-600 font-black text-base">{formatCurrency(lead.value)}</p>
                      <div className="flex gap-2">
                        {status !== LeadStatus.WON && (
                          <button 
                            onClick={() => moveLead(lead.id, LeadStatus.WON)} 
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
                            title="Mark as Won"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        )}
                      </div>
                   </div>
                </div>
              ))}
              {leads.filter(l => l.status === status).length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-50">
                  Empty Stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default LeadBoard;
