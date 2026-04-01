export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isPositive: boolean;
  category: string;
  description: string;
}

export const STOCKS: Stock[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 189.42,
    change: 2.14,
    isPositive: true,
    category: "Tech",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.30,
    change: -0.45,
    isPositive: false,
    category: "Tech",
    description: "Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America."
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 822.79,
    change: 4.82,
    isPositive: true,
    category: "Tech",
    description: "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally."
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 175.54,
    change: -1.28,
    isPositive: false,
    category: "Tech",
    description: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally."
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    price: 174.42,
    change: 0.67,
    isPositive: true,
    category: "Retail",
    description: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally."
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil Corp.",
    price: 112.45,
    change: 1.15,
    isPositive: true,
    category: "Energy",
    description: "Exxon Mobil Corporation explores for and produces crude oil and natural gas in the United States and internationally."
  },
  {
    symbol: "PFE",
    name: "Pfizer Inc.",
    price: 27.85,
    change: -0.22,
    isPositive: false,
    category: "Pharma",
    description: "Pfizer Inc. discovers, develops, manufactures, markets, distributes, and sells biopharmaceutical products worldwide."
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    price: 188.22,
    change: 0.88,
    isPositive: true,
    category: "Finance",
    description: "JPMorgan Chase & Co. operates as a financial services company worldwide."
  }
];

export interface TradeHistory {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell';
  quantity: number;
  price: number;
  date: string;
}

export const TRADE_HISTORY: TradeHistory[] = [
  { id: '1', symbol: 'AAPL', type: 'Buy', quantity: 10, price: 185.20, date: '2026-03-28T10:30:00Z' },
  { id: '2', symbol: 'NVDA', type: 'Buy', quantity: 5, price: 780.45, date: '2026-03-25T14:15:00Z' },
  { id: '3', symbol: 'TSLA', type: 'Sell', quantity: 2, price: 182.10, date: '2026-03-20T09:45:00Z' },
  { id: '4', symbol: 'AMZN', type: 'Buy', quantity: 15, price: 170.50, date: '2026-03-15T11:20:00Z' },
];

export const CATEGORIES = ["All", "Tech", "Energy", "Pharma", "Finance", "Retail"];
