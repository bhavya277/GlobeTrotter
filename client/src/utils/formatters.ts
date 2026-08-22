export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const code = currency?.toUpperCase() || 'INR';
  const symbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };

  const symbol = symbolMap[code] || (code.length === 1 ? code : `${code} `);
  const formattedNumber = Math.round(amount).toLocaleString();
  return `${symbol}${formattedNumber}`;
};
