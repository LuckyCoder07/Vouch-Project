import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Download, Users, FileCode2, BookOpen, AlertTriangle, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function OrgReport() {
  const { orgId } = useParams();
  const [report, setReport] = useState(null);
  const [org, setOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orgs/${orgId}/report`);
        if (!res.ok) throw new Error('Failed to fetch report');
        const data = await res.json();
        setReport(data.report);
        setOrg(data.org);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [orgId]);

  const handleExportCSV = () => {
    if (!report?.submissions) return;
    
    const headers = ['Student Name', 'File Name', 'Language', 'Submitted At', 'Verification Code', 'Structural Hash', 'Is Late'];
    const rows = report.submissions.map(s => [
      `"${s.student_name || ''}"`,
      `"${s.file_name || ''}"`,
      `"${s.language || ''}"`,
      `"${s.submitted_at || ''}"`,
      `"${s.verification_code || ''}"`,
      `"${s.structural_hash || ''}"`,
      `"${s.is_late ? 'Yes' : 'No'}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${org?.name?.replace(/\s+/g, '_') || 'org'}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading report...</div>;
  }

  if (!report || !org) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Failed to load report data.</div>;
  }

  // Calculate submissions per student for the chart
  const studentSubmissionsMap = {};
  report.submissions?.forEach(sub => {
    studentSubmissionsMap[sub.student_name] = (studentSubmissionsMap[sub.student_name] || 0) + 1;
  });
  const chartData = Object.keys(studentSubmissionsMap).map(name => ({
    name,
    count: studentSubmissionsMap[name]
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 pb-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-5">
            <Link to="/org" className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2 print:hidden" title="Back to Dashboard">
              <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-600/20">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{org.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Organization Analytics</p>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">Generated: {report.generated_at ? format(new Date(report.generated_at), 'PP p') : 'Unknown'}</p>
            </div>
          </div>
          
          <div className="flex gap-3 print:hidden">
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button 
              onClick={handleExportCSV} 
              className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-3 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Members', value: report.members_count, icon: Users, color: 'blue' },
            { label: 'Submissions', value: report.submissions_count, icon: FileCode2, color: 'emerald' },
            { label: 'Assignments', value: report.assignments_count, icon: BookOpen, color: 'amber' },
            { label: 'Flagged Code', value: report.flags_count, icon: AlertTriangle, color: 'rose' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black tracking-tight">{stat.value || 0}</p>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* SUBMISSIONS CHART */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm page-break-inside-avoid">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Member Engagement
            </h2>
            {chartData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 600}} stroke="currentColor" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'white' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[0, 8, 8, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-400 font-medium">No submission data available.</p>
              </div>
            )}
          </div>

          {/* QUICK ALERTS */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm page-break-inside-avoid">
             <h2 className="text-xl font-black mb-6">Critical Flags</h2>
             <div className="space-y-4">
               {report.flags?.slice(0, 5).map(f => (
                 <div key={f.id} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black uppercase text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">High Match</span>
                      <span className="text-xs font-medium text-gray-400">{format(new Date(f.flagged_at), 'MMM d')}</span>
                    </div>
                    <p className="text-sm font-bold truncate">
                      {f.submission_id_1?.student_name} <span className="text-gray-400 font-normal mx-1">&</span> {f.submission_id_2?.student_name}
                    </p>
                 </div>
               ))}
               {(!report.flags || report.flags.length === 0) && (
                 <div className="text-center py-8">
                   <div className="bg-green-100 dark:bg-green-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                     <span className="text-green-600 text-xl font-bold">✓</span>
                   </div>
                   <p className="text-sm font-bold text-gray-500 dark:text-gray-400">All clean! No flags.</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* ASSIGNMENTS TABLE */}
        <div className="mb-12 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm page-break-inside-avoid overflow-hidden">
          <h2 className="text-xl font-black mb-6">Assignments Overview</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4 text-center">Engagement</th>
                  <th className="px-6 py-4 text-center">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {report.assignments?.map(a => {
                  const total = (a.on_time_count || 0) + (a.late_count || 0);
                  const completionRate = report.members_count > 0 ? Math.round((total / report.members_count) * 100) : 0;
                  
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold">{a.title}</td>
                      <td className="px-6 py-4 text-gray-500">{a.deadline ? format(new Date(a.deadline), 'PP p') : 'Open'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-green-600 font-bold">{a.on_time_count}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-orange-500 font-bold">{a.late_count}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${Math.min(completionRate, 100)}%` }}></div>
                          </div>
                          <span className="font-bold text-xs">{completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FULL SUBMISSIONS TABLE */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <h2 className="text-xl font-black mb-6">Submission Archive</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4 font-mono">Vouch Code</th>
                  <th className="px-6 py-4 text-center">Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {report.submissions?.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold">{s.student_name}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{s.file_name}</div>
                      <div className="text-xs text-gray-400 uppercase font-black">{s.language}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(s.submitted_at), 'MMM d, p')}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{s.verification_code}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-[9px] uppercase font-black rounded-full border ${s.is_late ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                        {s.is_late ? 'Late' : 'Punctual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style jsx>{`
        @media print {
          body { background: white !important; color: black !important; }
          .dark { --tw-bg-opacity: 1; background-color: rgb(255 255 255) !important; }
          .bg-white, .dark\\:bg-gray-900 { background: white !important; border-color: #eee !important; box-shadow: none !important; }
          .text-white, .dark\\:text-gray-900 { color: black !important; }
          .print\\:hidden { display: none !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          .rounded-3xl { border-radius: 12px !important; }
          .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
