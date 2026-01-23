/**
 * Utility function to download a blob as a file
 * @param blob - The blob to download
 * @param filename - The name of the file to download
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  window.URL.revokeObjectURL(url);
};

/**
 * Format date for filename (YYYY-MM-DD)
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDateForFilename = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate filename for expense report
 * @param startDate - Start date of the report
 * @param endDate - End date of the report
 * @param extension - File extension (xlsx or pdf)
 * @returns Generated filename
 */
export const generateReportFilename = (
  startDate: string,
  endDate: string,
  extension: 'xlsx' | 'pdf'
): string => {
  const start = formatDateForFilename(startDate);
  const end = formatDateForFilename(endDate);
  return `expenses_${start}_to_${end}.${extension}`;
};

