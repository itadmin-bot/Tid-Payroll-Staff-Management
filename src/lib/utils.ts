import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
}

export function calculateTax(grossSalary: number) {
  // Simplified Nigerian PAYE calculation for demo
  // In reality, this is much more complex
  const annualGross = grossSalary * 12;
  let tax = 0;
  
  if (annualGross <= 300000) tax = annualGross * 0.07;
  else if (annualGross <= 600000) tax = 21000 + (annualGross - 300000) * 0.11;
  else if (annualGross <= 1100000) tax = 54000 + (annualGross - 600000) * 0.15;
  else if (annualGross <= 1600000) tax = 129000 + (annualGross - 1100000) * 0.19;
  else if (annualGross <= 3200000) tax = 224000 + (annualGross - 1600000) * 0.21;
  else tax = 560000 + (annualGross - 3200000) * 0.24;
  
  return tax / 12;
}

export function calculatePension(grossSalary: number) {
  // 8% employee contribution
  return grossSalary * 0.08;
}
