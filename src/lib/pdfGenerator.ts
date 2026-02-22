import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Payslip, UserProfile } from '../types';
import { formatCurrency } from './utils';
import { format } from 'date-fns';

export const generatePayslipPDF = (payslip: Payslip, profile: UserProfile) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74); // primary-600
  doc.text('Tidé Hotels and Resorts', margin, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('38 S.O Williams Street, Utako, Abuja', margin, 38);
  doc.text('Email: hello@tidehotelgroup.com', margin, 43);
  doc.text('Tel: +234 911 111 1314', margin, 48);

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('PAYSLIP', pageWidth - margin - 30, 30);
  
  doc.setFontSize(10);
  doc.text(`Month: ${format(new Date(payslip.month), 'MMMM yyyy')}`, pageWidth - margin - 50, 38);
  doc.text(`Employee ID: ${payslip.employeeId}`, pageWidth - margin - 50, 43);

  // Employee Details
  doc.setDrawColor(200);
  doc.line(margin, 55, pageWidth - margin, 55);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information', margin, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${profile.displayName}`, margin, 72);
  doc.text(`Department: ${profile.department || 'N/A'}`, margin, 77);
  doc.text(`Designation: ${profile.designation || 'N/A'}`, margin, 82);
  doc.text(`Bank: ${profile.bankName || 'N/A'}`, margin, 87);
  doc.text(`Account: ${profile.accountNumber || 'N/A'}`, margin, 92);

  // Earnings Table
  const earningsData = [
    ['Basic Salary', formatCurrency(payslip.baseSalary)],
    ['Housing Allowance', formatCurrency(payslip.allowances.housing)],
    ['Transport Allowance', formatCurrency(payslip.allowances.transport)],
    ['Medical Allowance', formatCurrency(payslip.allowances.medical)],
    ['Other Allowances', formatCurrency(payslip.allowances.other)],
    [{ content: 'Total Earnings', styles: { fontStyle: 'bold' } }, { content: formatCurrency(payslip.grossSalary), styles: { fontStyle: 'bold' } }]
  ];

  (doc as any).autoTable({
    startY: 100,
    head: [['Earnings', 'Amount']],
    body: earningsData,
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
    margin: { left: margin, right: pageWidth / 2 + 5 }
  });

  // Deductions Table
  const deductionsData = [
    ['PAYE Tax', formatCurrency(payslip.deductions.tax)],
    ['Pension (8%)', formatCurrency(payslip.deductions.pension)],
    ['Loan Repayment', formatCurrency(payslip.deductions.loan)],
    ['Other Deductions', formatCurrency(payslip.deductions.other)],
    ['', ''],
    [{ content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: formatCurrency(payslip.deductions.tax + payslip.deductions.pension + payslip.deductions.loan + payslip.deductions.other), styles: { fontStyle: 'bold' } }]
  ];

  (doc as any).autoTable({
    startY: 100,
    head: [['Deductions', 'Amount']],
    body: deductionsData,
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: pageWidth / 2 + 5, right: margin }
  });

  // Net Pay Summary
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(1);
  doc.rect(margin, finalY, pageWidth - 2 * margin, 25);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NET SALARY PAYABLE', margin + 10, finalY + 16);
  doc.text(formatCurrency(payslip.netSalary), pageWidth - margin - 60, finalY + 16);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, 280, { align: 'center' });

  doc.save(`Payslip_${payslip.employeeId}_${payslip.month}.pdf`);
};
