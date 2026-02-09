import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { Invoice, Lead, InvoiceStatus } from '../types';
import { formatCurrency } from '../services/Calculations';

interface DashboardProps {
  invoices: Invoice[];
  leads: Lead[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, leads }) => {
  const calculateTotal = (inv: Invoice) => 
    inv.items.reduce((sum, item) => sum + (item.qty * item.rate * (1 + item.taxRate / 100)), 0);

  const totalRevenue = invoices
    .filter(inv => inv.status === InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + calculateTotal(inv), 0);

  const outstanding = invoices
    .filter(inv => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE || inv.status === InvoiceStatus.DRAFT)
    .reduce((sum, inv) => sum + calculateTotal(inv), 0);

  const leadValue = leads.reduce((sum, l) => sum + l.value, 0);

  const chartData = [
    { name: 'Jan', sales: 45000 },
    { name: 'Feb', sales: 52000 },
    { name: 'Mar', sales: 48000 },
    { name: 'Apr', sales: 61000 },
    { name: 'May', sales: totalRevenue },
  ];

  const pieData = [
    { name: 'New', value: leads.filter(l => l.status === 'New').length },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Proposal', value: leads.filter(l => l.status === 'Proposal').length },
  ];

  const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe'];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Enterprise Overview</h1>
        <p className="text-gray-500 text-xs md:text-sm">Real-time performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest group-hover:text-indigo-500 transition">Collected Revenue</p>
          <p className="text-2xl md:text-3xl font-black text-indigo-600 mt-2">{formatCurrency(totalRevenue)}</p>
          <div className="mt-4 h-1 w-full bg-indigo-50 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 w-[70%]"></div>
          </div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest group-hover:text-orange-500 transition">Outstanding Credit</p>
          <p className="text-2xl md:text-3xl font-black text-orange-500 mt-2">{formatCurrency(outstanding)}</p>
          <div className="mt-4 h-1 w-full bg-orange-50 rounded-full overflow-hidden">
             <div className="h-full bg-orange-500 w-[40%]"></div>
          </div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 group sm:col-span-2 lg:col-span-1">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest group-hover:text-emerald-500 transition">Sales Pipeline</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-600 mt-2">{formatCurrency(leadValue)}</p>
          <div className="mt-4 h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 w-[55%]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
            Performance Trend
          </h2>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={window.innerWidth < 768 ? 25 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Lead Distribution
          </h2>
          <div className="h-64 md:h-72 flex flex-col md:flex-row items-center justify-center gap-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 768 ? 50 : 70}
                  outerRadius={window.innerWidth < 768 ? 80 : 100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-row md:flex-col gap-4 flex-wrap justify-center">
               {pieData.map((d, i) => (
                 <div key={d.name} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{d.name}</span>
                    </div>
                    <span className="text-lg md:text-xl font-black text-gray-800 ml-4">{d.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;