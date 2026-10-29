import React, { useState, useEffect } from 'react';
import { RoutePath } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, ReceiptText, Trash2, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/invoices', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch (e) {
        console.error("Failed to fetch invoices", e);
      }
    };
    fetchInvoices();
  }, []);

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to delete invoice');
      }
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
      setInvoiceToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete invoice:", err);
      setDeleteError(err.message || 'Error deleting invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-2">Manage and view your generated invoices.</p>
        </div>
        <Link to={RoutePath.CREATE_INVOICE}>
          <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Plus size={18} />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <ReceiptText size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No invoices yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">You haven't created any invoices. Start by creating your first professional invoice.</p>
            <Link to={RoutePath.CREATE_INVOICE}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Create your first invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Billed To</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      #{invoice.invoice_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {invoice.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="line-clamp-2 max-w-xs">{invoice.billed_to}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                      ${invoice.total}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/invoices/${invoice.id}/edit`}>
                          <Button variant="outline" size="sm" className="hover:border-indigo-500 hover:text-indigo-600">
                            Edit / Print
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setInvoiceToDelete(invoice)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                          title="Delete invoice"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Invoice Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md space-y-4 rounded-3xl border border-white/80 bg-white/95 backdrop-blur-2xl p-6 md:p-7 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete invoice?</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <button 
                onClick={() => { setInvoiceToDelete(null); setDeleteError(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
              <div>Invoice No: <strong className="text-slate-900 font-semibold">#{invoiceToDelete.invoice_no}</strong></div>
              <div>Billed to: <span className="text-slate-700">{invoiceToDelete.billed_to?.split('\n')[0] || 'Client'}</span></div>
              <div>Total: <strong className="text-slate-900 font-semibold">${invoiceToDelete.total}</strong></div>
            </div>

            {deleteError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                {deleteError}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                disabled={isDeleting}
                onClick={() => { setInvoiceToDelete(null); setDeleteError(null); }}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteInvoice}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all outline-none disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
