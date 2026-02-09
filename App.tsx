import React, { useState } from 'react';
import { 
  Invoice, 
  InvoiceStatus, 
  Lead, 
  LeadStatus, 
  Client, 
  UserBusinessProfile,
} from './types';
import { INITIAL_USER_PROFILE } from './constants';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import LeadBoard from './components/LeadBoard';
import ClientList from './components/ClientList';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'leads' | 'clients'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-1',
      number: 'INV-2024-001',
      date: '2024-05-10',
      dueDate: '2024-05-25',
      status: InvoiceStatus.PAID,
      clientId: 'client-1',
      items: [
        { id: 'item-1', description: 'Web Development Services', hsn: '9983', qty: 1, rate: 45000, taxRate: 18 }
      ],
      placeOfSupply: 'Delhi (07)'
    },
    {
      id: 'inv-2',
      number: 'INV-2024-002',
      date: '2024-05-12',
      dueDate: '2024-05-27',
      status: InvoiceStatus.SENT,
      clientId: 'client-2',
      items: [
        { id: 'item-2', description: 'Logo Design & Branding', hsn: '9982', qty: 1, rate: 12500, taxRate: 12 }
      ],
      placeOfSupply: 'Delhi (07)'
    }
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    { id: 'lead-1', name: 'John Doe', company: 'Nexus Inc', value: 50000, status: LeadStatus.NEW, createdAt: '2024-05-15' },
    { id: 'lead-2', name: 'Jane Smith', company: 'Global SCM', value: 120000, status: LeadStatus.PROPOSAL, createdAt: '2024-05-14' },
    { id: 'lead-3', name: 'Michael Ross', company: 'Ross & Co', value: 35000, status: LeadStatus.CONTACTED, createdAt: '2024-05-10' },
  ]);

  const [clients, setClients] = useState<Client[]>([
    { 
      id: 'client-1', 
      name: 'Nexus Inc', 
      email: 'billing@nexus.com', 
      gstin: '27AADCN1234F1Z1',
      address: { street: '123 Tech Park', city: 'Mumbai', state: 'Maharashtra', stateCode: '27', pincode: '400001', country: 'India' }
    },
    { 
      id: 'client-2', 
      name: 'Craft Daddy Institute', 
      email: 'admin@craftdaddy.in', 
      gstin: '07CCDPK8228H1ZI',
      address: { street: 'E-167 West Vinod Nagar', city: 'Delhi', state: 'Delhi', stateCode: '07', pincode: '110092', country: 'India' }
    }
  ]);

  const [userProfile] = useState<UserBusinessProfile>(INITIAL_USER_PROFILE);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleSaveInvoice = (invoice: Invoice) => {
    const exists = invoices.find(inv => inv.id === invoice.id);
    if (exists) {
      setInvoices(invoices.map(inv => inv.id === invoice.id ? invoice : inv));
    } else {
      setInvoices([invoice, ...invoices]);
    }
    setEditingInvoice(null);
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    const newNumber = `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    const duplicated: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
      status: InvoiceStatus.DRAFT,
      dueDate: ''
    };
    setInvoices([duplicated, ...invoices]);
  };

  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  const handleSaveClient = (client: Client) => {
    const exists = clients.find(c => c.id === client.id);
    if (exists) {
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      setClients([client, ...clients]);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard invoices={invoices} leads={leads} />;
      case 'invoices':
        if (editingInvoice) {
          return (
            <InvoiceForm 
              userProfile={userProfile} 
              clients={clients} 
              onSave={handleSaveInvoice} 
              onCancel={() => setEditingInvoice(null)}
              initialData={editingInvoice}
            />
          );
        }
        return (
          <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Invoices</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage billing and compliance</p>
              </div>
              <button 
                onClick={() => setEditingInvoice({ 
                  id: `inv-${Date.now()}`, 
                  number: `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`, 
                  date: new Date().toISOString().split('T')[0], 
                  dueDate: '', 
                  status: InvoiceStatus.DRAFT, 
                  clientId: clients[0]?.id || '', 
                  items: [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
                  placeOfSupply: 'Delhi (07)',
                  bankDetails: userProfile.bankAccounts[0],
                  terms: '1. Subject to Delhi jurisdiction only.\n2. Payment within due date.'
                })}
                className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Invoice
              </button>
            </div>
            <InvoiceList 
              invoices={invoices} 
              clients={clients} 
              onEdit={setEditingInvoice}
              onDuplicate={handleDuplicateInvoice}
              onUpdateStatus={handleUpdateInvoiceStatus}
              onDelete={handleDeleteInvoice}
            />
          </div>
        );
      case 'leads':
        return <LeadBoard leads={leads} setLeads={setLeads} />;
      case 'clients':
        return <ClientList clients={clients} onSave={handleSaveClient} onDelete={(id) => setClients(clients.filter(c => c.id !== id))} />;
      default:
        return <div className="p-10 text-center text-gray-500">Feature coming soon...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative print:h-auto print:overflow-visible print:block">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity no-print"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Positioned absolutely on mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            setEditingInvoice(null);
            setIsSidebarOpen(false);
          }} 
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:h-auto print:overflow-visible print:block">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 no-print">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             </button>
             <h2 className="font-black text-indigo-600 tracking-tighter uppercase">Craft Daddy</h2>
          </div>
          <img src="https://picsum.photos/32/32" className="w-8 h-8 rounded-full" alt="Avatar" />
        </header>

        <main className="flex-1 overflow-y-auto print:h-auto print:overflow-visible print:block">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;