import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'Invalid Date';
  
  try {
    // Clean the date string to remove any extra characters
    const cleanDateString = String(dateString).trim();
    
    const date = new Date(cleanDateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    // Use a more specific date format to avoid any locale issues
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateString);
    return 'Invalid Date';
  }
}