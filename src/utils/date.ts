/**
 * Formats a date string to DD.MM.yyyy hh:mm format
 * @param dateString - ISO date string or any valid date string
 * @returns Formatted date string in DD.MM.yyyy hh:mm format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day}.${month}.${year} ${hours}:${minutes}`
} 