import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RoutePath } from '../../types';
import { Button } from '../../components/ui/Button';
import { Download, Plus, Trash2, Printer, Loader2, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoiceNo, setInvoiceNo] = useState('000001');
  const [date, setDate] = useState('02 June, 2030');
  
  const [billedTo, setBilledTo] = useState('Studio Shodwe\n123 Anywhere St., Any City\nhello@reallygreatsite.com');
  const [from, setFrom] = useState('Olivia Wilson\n123 Anywhere St., Any City\nhello@reallygreatsite.com');
  
  const [items, setItems] = useState<any[]>([
    { id: 1, name: 'Logo', qty: 1, price: 500 },
    { id: 2, name: 'Banner (2x6m)', qty: 2, price: 45 },
    { id: 3, name: 'Poster (1x2m)', qty: 3, price: 55 },
  ]);
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [note, setNote] = useState('Thank you for choosing us!');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchInvoice = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/invoices/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setInvoiceNo(data.invoice_no);
            setDate(data.date);
            setBilledTo(data.billed_to);
            setFrom(data.from_address);
            setItems(typeof data.items === 'string' ? JSON.parse(data.items) : data.items);
            setPaymentMethod(data.payment_method);
            setNote(data.note);
          }
        } catch (e) {
          console.error("Failed to load invoice:", e);
        }
      };
      fetchInvoice();
    }
  }, [id]);

  const addLineItem = () => {
    setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0 }]);
  };

  const removeLineItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateLineItem = (itemId: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const total = items.reduce((acc, item) => acc + (item.qty * item.price), 0);

  const handleSave = async () => {
    const newInvoice = {
      invoice_no: invoiceNo,
      date,
      billed_to: billedTo,
      from_address: from,
      items,
      total,
      payment_method: paymentMethod,
      note
    };
    
    try {
      const token = localStorage.getItem('token');
      const url = id ? `/api/invoices/${id}` : '/api/invoices';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newInvoice)
      });
      if (!res.ok) throw new Error('Failed to save invoice');
      navigate(RoutePath.INVOICES);
    } catch (e) {
      console.error("Failed to save invoice", e);
      alert("Failed to save invoice");
    }
  };

  const handleDeleteInvoice = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete invoice');
      navigate(RoutePath.INVOICES);
    } catch (e) {
      console.error("Failed to delete invoice:", e);
      alert("Failed to delete invoice");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to print the invoice.");
      return;
    }

    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; text-align: left; font-size: 15px; color: #334155;">${item.name || 'Item description...'}</td>
        <td style="padding: 12px 16px; text-align: center; font-size: 15px; color: #334155;">${item.qty}</td>
        <td style="padding: 12px 16px; text-align: center; font-size: 15px; color: #334155;">$${item.price}</td>
        <td style="padding: 12px 16px; text-align: right; font-size: 15px; font-weight: 500; color: #334155;">$${item.qty * item.price}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice No. ${invoiceNo}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              @page { size: A4; margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; margin: 0; padding: 0; }
            }
            body {
              font-family: ui-sans-serif, system-ui, sans-serif;
              color: #1e293b;
              background-color: #f1f5f9;
              padding: 40px 0;
            }
            .page {
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 64px 48px;
              box-sizing: border-box;
              position: relative;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            @media print {
              body { padding: 0; background: white; }
              .page { box-shadow: none; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <!-- Top Section -->
            <div class="flex justify-end items-start mb-16">
              <div class="font-semibold text-sm tracking-wider uppercase text-slate-800">
                NO. ${invoiceNo}
              </div>
            </div>

            <!-- Giant Title -->
            <div class="mb-12">
               <h2 class="text-6xl font-black tracking-tight text-slate-900 uppercase">INVOICE</h2>
            </div>

            <!-- Date -->
            <div class="mb-8 text-[15px]">
               <span class="font-bold text-slate-900">Date:</span> <span class="text-slate-700 ml-2">${date}</span>
            </div>

            <!-- Address Grid -->
            <div class="grid grid-cols-2 gap-12 mb-12">
               <div>
                 <h4 class="font-bold text-slate-900 text-[15px] mb-2">Billed to:</h4>
                 <div class="text-slate-600 text-[15px] whitespace-pre-line leading-relaxed">${billedTo.replace(/\n/g, '<br>')}</div>
               </div>
               <div>
                 <h4 class="font-bold text-slate-900 text-[15px] mb-2">From:</h4>
                 <div class="text-slate-600 text-[15px] whitespace-pre-line leading-relaxed">${from.replace(/\n/g, '<br>')}</div>
               </div>
            </div>

            <!-- Items Table -->
            <div class="mb-12">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f1f5f9; font-weight: 600; color: #1e293b; font-size: 15px;">
                    <th style="padding: 12px 16px; text-align: left; width: 50%;">Item</th>
                    <th style="padding: 12px 16px; text-align: center; width: 15%;">Quantity</th>
                    <th style="padding: 12px 16px; text-align: center; width: 15%;">Price</th>
                    <th style="padding: 12px 16px; text-align: right; width: 20%;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total row -->
              <div class="mt-6 flex border-t-2 border-slate-200 pt-4" style="display: flex; justify-content: flex-end; align-items: center;">
                 <div style="font-weight: bold; color: #0f172a; font-size: 15px; margin-right: 48px;">
                   Total
                 </div>
                 <div style="font-weight: 900; color: #0f172a; font-size: 15px;">
                   $${total}
                 </div>
              </div>
            </div>

            <!-- Footer Summary -->
            <div class="text-[15px] space-y-2 mb-24">
              <div>
                <span class="font-bold text-slate-900">Payment method:</span> <span class="text-slate-700 ml-2">${paymentMethod}</span>
              </div>
              <div>
                <span class="font-bold text-slate-900">Note:</span> <span class="text-slate-700 ml-2">${note}</span>
              </div>
            </div>

            <!-- Bottom Graphic Shapes -->
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 256px; pointer-events: none; overflow: hidden;">
                <svg viewBox="0 0 800 256" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; object-fit: cover;">
                  <path d="M-50 256H450C450 256 350 50 150 150C-50 250 -50 256 -50 256Z" fill="#D1D5DB" />
                  <path d="M0 256H800V80C800 80 650 200 450 150C250 100 0 256 0 256Z" fill="#4B5563" />
                </svg>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      // A4 size in pt: 595.28 x 841.89
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice_${invoiceNo}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
            #root > div { display: block !important; }
            aside { display: none !important; }
            main { padding: 0 !important; margin: 0 !important; }
          }
        `}
      </style>
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Invoice</h1>
          <p className="text-slate-500 mt-2">Generate a professional invoice matching your template.</p>
        </div>
        <div className="flex gap-3">
          {id && (
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2 border-slate-300 hover:border-indigo-600 hover:text-indigo-600 active:scale-95 transition-all" onClick={handlePrint}>
            <Printer size={18} />
            Print
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExportPDF}>
            <Download size={18} />
            Export PDF
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        
        {/* Settings Sidebar */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Configuration</h3>
            
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                 <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                 <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Billed To</label>
                 <textarea value={billedTo} onChange={(e) => setBilledTo(e.target.value)} rows={3} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"></textarea>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                 <textarea value={from} onChange={(e) => setFrom(e.target.value)} rows={3} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"></textarea>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                 <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                   <option value="Cash">Cash</option>
                   <option value="Visa">Visa</option>
                   <option value="Payoneer">Payoneer</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                 <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
               </div>
            </div>
          </div>
        </div>

        {/* Invoice Preview Canvas */}
        <div className="lg:col-span-8 flex justify-center bg-slate-100 rounded-2xl p-4 sm:p-8 overflow-x-auto border border-slate-200 print:bg-transparent print:border-none print:p-0 print:m-0 print:block">
          <div ref={invoiceRef} className="bg-white w-full max-w-[794px] min-h-[1123px] mx-auto relative shadow-xl print:shadow-none overflow-hidden" 
               style={{ aspectRatio: '1 / 1.414' }}>
            
            {/* Top Section */}
            <div className="px-12 pt-16 flex justify-end items-start">
              <div className="font-semibold text-sm tracking-wider uppercase text-slate-800 mt-2">
                NO. {invoiceNo}
              </div>
            </div>

            {/* Giant Title */}
            <div className="px-12 mt-16 mb-12">
               <h2 className="text-[56px] font-black tracking-tight text-slate-900 uppercase">INVOICE</h2>
            </div>

            {/* Date */}
            <div className="px-12 mb-8 text-[15px]">
               <span className="font-bold text-slate-900">Date:</span> <span className="text-slate-700 ml-2">{date}</span>
            </div>

            {/* Address Grid */}
            <div className="px-12 grid grid-cols-2 gap-12 mb-12">
               <div>
                 <h4 className="font-bold text-slate-900 text-[15px] mb-2">Billed to:</h4>
                 <div className="text-slate-600 text-[15px] whitespace-pre-line leading-relaxed">
                   {billedTo}
                 </div>
               </div>
               <div>
                 <h4 className="font-bold text-slate-900 text-[15px] mb-2">From:</h4>
                 <div className="text-slate-600 text-[15px] whitespace-pre-line leading-relaxed">
                   {from}
                 </div>
               </div>
            </div>

            {/* Items Table */}
            <div className="px-12 mb-12">
               <div className="bg-slate-200 flex py-3 px-4 font-semibold text-slate-800 text-[15px]">
                 <div className="flex-[3]">Item</div>
                 <div className="flex-1 text-center">Quantity</div>
                 <div className="flex-1 text-center">Price</div>
                 <div className="flex-1 text-right">Amount</div>
               </div>
               
               <div className="mt-4 space-y-4">
                 {items.map((item, index) => (
                   <div key={item.id} className="flex px-4 py-2 text-[15px] group border-b border-transparent hover:bg-slate-50 relative">
                     <div className="flex-[3] flex items-center pr-4">
                       <input 
                         className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-700 placeholder-slate-400" 
                         value={item.name} 
                         onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                         placeholder="Item description..."
                       />
                     </div>
                     <div className="flex-1 flex items-center justify-center">
                        <input 
                         type="number"
                         className="w-16 bg-transparent border-none p-0 focus:ring-0 text-slate-700 text-center" 
                         value={item.qty} 
                         onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                       />
                     </div>
                     <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-1">$</span>
                          <input 
                           type="number"
                           className="w-20 bg-transparent border-none p-0 focus:ring-0 text-slate-700 text-left" 
                           value={item.price} 
                           onChange={(e) => updateLineItem(item.id, 'price', parseInt(e.target.value) || 0)}
                         />
                        </div>
                     </div>
                     <div className="flex-1 flex items-center justify-end font-medium text-slate-700">
                       ${item.qty * item.price}
                     </div>
                     <button onClick={() => removeLineItem(item.id)} data-html2canvas-ignore="true" className="print:hidden absolute -right-8 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
               </div>

               <button onClick={addLineItem} data-html2canvas-ignore="true" className="print:hidden mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  <Plus size={16} className="mr-1" /> Add Line Item
               </button>

               <div className="mt-6 flex border-t-2 border-slate-200 pt-4">
                 <div className="flex-[4]"></div>
                 <div className="flex-1 flex items-center justify-center font-bold text-slate-900 text-[15px] tracking-wide">
                   Total
                 </div>
                 <div className="flex-1 flex items-center justify-end font-black text-slate-900 text-[15px]">
                   ${total}
                 </div>
               </div>
               <div className="mt-2 border-b-2 border-slate-100"></div>
            </div>

            {/* Footer Summary */}
            <div className="px-12 text-[15px] space-y-2">
              <div>
                <span className="font-bold text-slate-900">Payment method:</span> <span className="text-slate-700 ml-2">{paymentMethod}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Note:</span> <span className="text-slate-700 ml-2">{note}</span>
              </div>
            </div>

            {/* Bottom Graphic Shapes */}
            <div className="absolute bottom-0 left-0 w-full h-[256px] pointer-events-none">
                <svg viewBox="0 0 800 256" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
                  {/* Light grey wave */}
                  <path d="M-50 256H450C450 256 350 50 150 150C-50 250 -50 256 -50 256Z" fill="#D1D5DB" />
                  {/* Dark grey wave */}
                  <path d="M0 256H800V80C800 80 650 200 450 150C250 100 0 256 0 256Z" fill="#4B5563" />
                </svg>
            </div>

          </div>
        </div>
      </div>

      {/* Delete Invoice Confirmation Modal */}
      {isDeleteModalOpen && (
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
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
              Are you sure you want to permanently delete invoice <strong className="text-slate-900 font-semibold">#{invoiceNo}</strong>?
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
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
