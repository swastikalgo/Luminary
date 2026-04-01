/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  LayoutDashboard, 
  BarChart3, 
  ArrowLeftRight, 
  User,
  Apple,
  Chrome,
  Cpu,
  Car,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Activity,
  Zap,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { cn } from './lib/utils';
import { useAuth } from './context/AuthContext';
import { STOCKS, CATEGORIES, Stock, TRADE_HISTORY } from './data/mockData';
import { mt5Service } from './services/mt5Service';

interface StockItemProps {
  stock: Stock;
  highlighted?: boolean;
  onClick: () => void;
  key?: string | number;
}

const StockCard = ({ stock, highlighted, onClick }: StockItemProps) => {
  const Icon = useMemo(() => {
    switch (stock.symbol) {
      case 'AAPL': return Apple;
      case 'GOOGL': return Chrome;
      case 'NVDA': return Cpu;
      case 'TSLA': return Car;
      case 'AMZN': return ShoppingCart;
      default: return Activity;
    }
  }, [stock.symbol]);

  return (
    <motion.div 
      whileHover={{ backgroundColor: 'var(--color-surface-container-high)', borderColor: 'rgba(61, 229, 48, 0.2)' }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl flex items-center justify-between transition-all duration-300 cursor-pointer border border-outline-variant/10",
        highlighted ? "bg-surface-container-low border-l-2 border-l-primary border-primary/20" : "bg-surface"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center border border-outline-variant/10",
          highlighted ? "bg-surface-container-highest" : "bg-surface-container-low"
        )}>
          <Icon size={20} className="text-on-surface" />
        </div>
        <div>
          <p className="font-label text-sm font-bold text-on-surface">{stock.symbol}</p>
          <p className="font-body text-[11px] text-on-surface-variant">{stock.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-body text-sm font-bold text-on-surface">${stock.price.toFixed(2)}</p>
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1",
          stock.isPositive ? "bg-primary/10 text-primary" : "bg-secondary-container/10 text-secondary"
        )}>
          {stock.isPositive ? '+' : ''}{stock.change}%
        </span>
      </div>
    </motion.div>
  );
};

const CategoryChip = ({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void; key?: string | number }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95",
      active 
        ? "bg-primary/10 border border-primary/20 text-primary" 
        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
    )}
  >
    {label}
  </button>
);

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) login(email);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-12 justify-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="text-primary" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-primary font-headline">LUMINARY</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant/10 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 text-on-surface placeholder:text-outline/60 font-body transition-all"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full h-14 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all active:scale-[0.98] shadow-lg shadow-primary/20 border border-primary/20"
          >
            Sign In
          </button>
        </form>
        
        <p className="text-center text-on-surface-variant text-xs mt-8 font-body">
          By signing in, you agree to our Terms of Service.
        </p>
      </motion.div>
    </div>
  );
};

export default function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Market');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedRange, setSelectedRange] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1W');

  // MT5 Trade State
  const [tradeSymbol, setTradeSymbol] = useState(STOCKS[0].symbol);
  const [tradeQuantity, setTradeQuantity] = useState<number>(0);
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell'>('Buy');
  const [mt5Status, setMt5Status] = useState<{ type: 'success' | 'error' | 'loading' | null, message: string }>({ type: null, message: '' });

  const handlePlaceTrade = async () => {
    if (tradeQuantity <= 0) {
      setMt5Status({ type: 'error', message: 'Please enter a valid quantity.' });
      return;
    }

    setMt5Status({ type: 'loading', message: 'Connecting to MT5...' });
    
    const stock = STOCKS.find(s => s.symbol === tradeSymbol);
    const result = await mt5Service.placeTrade({
      symbol: tradeSymbol,
      type: tradeType,
      quantity: tradeQuantity,
      price: stock?.price
    });

    if (result.success) {
      setMt5Status({ type: 'success', message: result.message || 'Trade executed on MT5!' });
      setTradeQuantity(0);
    } else {
      setMt5Status({ type: 'error', message: result.error || 'MT5 trade failed.' });
    }

    // Clear status after 5 seconds
    setTimeout(() => setMt5Status({ type: null, message: '' }), 5000);
  };

  const filteredStocks = useMemo(() => {
    return STOCKS.filter(stock => {
      const matchesCategory = selectedCategory === 'All' || stock.category === selectedCategory;
      const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const chartData = useMemo(() => {
    if (!selectedStock) return [];
    
    let points = 7;
    let interval = 1;
    
    switch (selectedRange) {
      case '1D': points = 24; interval = 1; break;
      case '1W': points = 7; interval = 1; break;
      case '1M': points = 30; interval = 1; break;
      case '1Y': points = 12; interval = 30; break;
      case 'ALL': points = 24; interval = 60; break;
    }

    return Array.from({ length: points }).map((_, i) => {
      const date = new Date();
      if (selectedRange === '1D') {
        date.setHours(date.getHours() - (points - 1 - i));
      } else {
        date.setDate(date.getDate() - (points - 1 - i) * interval);
      }
      
      const basePrice = selectedStock.price;
      const volatility = basePrice * 0.08;
      const randomChange = (Math.random() - 0.5) * volatility;
      
      return {
        date: selectedRange === '1D' 
          ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Number((basePrice + randomChange).toFixed(2))
      };
    });
  }, [selectedStock, selectedRange]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-surface-container-low/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 py-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
              <img 
                alt="User profile" 
                className="w-full h-full object-cover" 
                src={user?.avatar}
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter text-primary font-headline">LUMINARY</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-xl active:scale-95">
              <Bell size={20} />
            </button>
            <button 
              onClick={logout}
              className="text-secondary hover:bg-secondary-container/10 transition-colors p-2 rounded-xl active:scale-95"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-28 px-6 pt-4 max-w-lg mx-auto">
        {activeTab === 'Market' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative flex items-center group">
                <Search className="absolute left-4 text-outline group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/10 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 text-on-surface placeholder:text-outline/60 font-body transition-all duration-300 shadow-inner shadow-black/10" 
                  placeholder="Search stocks, indices, ETFs" 
                  type="text"
                />
              </div>
            </div>

            {/* Hero Section */}
            <section className="mb-10">
              <div className="flex flex-col gap-1">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-outline font-bold">Total Market Cap</span>
                <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">$102.4T</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    <TrendingUp size={12} className="mr-0.5" />
                    +1.2%
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-body">Global Market 24h</span>
                </div>
              </div>
            </section>

            {/* Ticker Tape */}
            <div className="mb-10 overflow-hidden whitespace-nowrap bg-surface-container-low/30 py-3 -mx-6 px-6">
              <div className="flex gap-10 animate-marquee">
                {[...STOCKS, ...STOCKS].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-label text-xs font-bold text-on-surface">{item.symbol}</span>
                    <span className={cn("font-body text-xs", item.isPositive ? "text-primary" : "text-secondary")}>
                      {item.isPositive ? '+' : ''}{item.change}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h3 className="font-headline text-lg font-bold mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <CategoryChip 
                    key={cat} 
                    label={cat} 
                    active={selectedCategory === cat} 
                    onClick={() => setSelectedCategory(cat)}
                  />
                ))}
              </div>
            </div>

            {/* Trending Stocks */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 className="font-headline text-lg font-bold">Trending Stocks</h3>
                <button className="text-primary font-label text-xs font-bold hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {filteredStocks.map((stock) => (
                  <StockCard 
                    key={stock.symbol}
                    stock={stock}
                    highlighted={stock.symbol === 'NVDA'}
                    onClick={() => setSelectedStock(stock)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-primary/20 shadow-xl shadow-primary/5 ring-1 ring-white/5">
              <p className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Portfolio Balance</p>
              <h2 className="text-4xl font-headline font-bold text-on-surface">${user?.balance.toLocaleString()}</h2>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-primary text-sm font-bold">+ $1,240.50 (1.2%)</span>
                <span className="text-on-surface-variant text-xs">Today</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Buying Power</p>
                <p className="text-lg font-bold text-on-surface">$12,450.00</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Active Trades</p>
                <p className="text-lg font-bold text-on-surface">12</p>
              </div>
            </div>

            <div>
              <h3 className="font-headline text-lg font-bold mb-4">Your Assets</h3>
              <div className="space-y-3">
                {STOCKS.slice(0, 3).map(stock => (
                  <div key={stock.symbol} className="bg-surface p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center border border-outline-variant/10">
                        <Briefcase size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{stock.symbol}</p>
                        <p className="text-[10px] text-on-surface-variant">10 Shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${(stock.price * 10).toFixed(2)}</p>
                      <p className="text-[10px] text-primary">+2.4%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Trade' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-primary/20 shadow-xl shadow-primary/5 ring-1 ring-white/5">
              <h3 className="font-headline text-lg font-bold mb-4">Quick Trade</h3>
              <div className="space-y-4">
                <div className="flex gap-2 mb-2">
                  <button 
                    onClick={() => setTradeType('Buy')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      tradeType === 'Buy' ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-surface text-on-surface-variant border border-outline-variant/10"
                    )}
                  >
                    BUY
                  </button>
                  <button 
                    onClick={() => setTradeType('Sell')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      tradeType === 'Sell' ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/20" : "bg-surface text-on-surface-variant border border-outline-variant/10"
                    )}
                  >
                    SELL
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2 ml-1">Select Asset</label>
                  <select 
                    value={tradeSymbol}
                    onChange={(e) => setTradeSymbol(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl bg-surface border border-outline-variant/10 text-on-surface font-body focus:ring-1 focus:ring-primary/20 transition-all"
                  >
                    {STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2 ml-1">Quantity</label>
                    <input 
                      type="number" 
                      value={tradeQuantity || ''}
                      onChange={(e) => setTradeQuantity(Number(e.target.value))}
                      placeholder="0" 
                      className="w-full h-14 px-4 rounded-xl bg-surface border border-outline-variant/10 text-on-surface font-body focus:ring-1 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2 ml-1">Order Type</label>
                    <select className="w-full h-14 px-4 rounded-xl bg-surface border border-outline-variant/10 text-on-surface font-body focus:ring-1 focus:ring-primary/20 transition-all">
                      <option>Market</option>
                      <option>Limit</option>
                    </select>
                  </div>
                </div>

                {mt5Status.type && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg text-xs font-medium text-center",
                      mt5Status.type === 'success' ? "bg-primary/10 text-primary border border-primary/20" : 
                      mt5Status.type === 'error' ? "bg-secondary/10 text-secondary border border-secondary/20" :
                      "bg-surface-container-high text-on-surface-variant animate-pulse"
                    )}
                  >
                    {mt5Status.message}
                  </motion.div>
                )}

                <button 
                  onClick={handlePlaceTrade}
                  disabled={mt5Status.type === 'loading'}
                  className={cn(
                    "w-full h-14 font-bold rounded-xl transition-all active:scale-[0.98] mt-2 shadow-lg border",
                    tradeType === 'Buy' 
                      ? "bg-primary text-on-primary shadow-primary/20 border-primary/20 hover:bg-primary-container" 
                      : "bg-secondary text-on-secondary shadow-secondary/20 border-secondary/20 hover:bg-secondary-container",
                    mt5Status.type === 'loading' && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {mt5Status.type === 'loading' ? 'Executing...' : `Place ${tradeType} Order`}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-headline text-lg font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {TRADE_HISTORY.map(trade => (
                  <div key={trade.id} className="bg-surface p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant/10",
                        trade.type === 'Buy' ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                      )}>
                        {trade.type === 'Buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{trade.type} {trade.symbol}</p>
                        <p className="text-[10px] text-on-surface-variant">{new Date(trade.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${(trade.price * trade.quantity).toLocaleString()}</p>
                      <p className="text-[10px] text-on-surface-variant">{trade.quantity} shares @ ${trade.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 mb-4 p-1">
                <img 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full" 
                  src={user?.avatar}
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">{user?.name}</h2>
              <p className="text-sm text-on-surface-variant">{user?.email}</p>
              <div className="mt-6 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Premium Member</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl text-center border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Trades</p>
                <p className="text-lg font-bold text-on-surface">42</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl text-center border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Rank</p>
                <p className="text-lg font-bold text-on-surface">#12</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl text-center border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Win Rate</p>
                <p className="text-lg font-bold text-on-surface">68%</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 ml-1">Account Settings</h4>
              {[
                { icon: <User size={18} />, label: 'Personal Information' },
                { icon: <Bell size={18} />, label: 'Notifications' },
                { icon: <Briefcase size={18} />, label: 'Security & Privacy' },
                { icon: <Activity size={18} />, label: 'Trading Preferences' },
              ].map((item, i) => (
                <button key={i} className="w-full p-4 bg-surface rounded-xl flex items-center justify-between group hover:bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="text-on-surface-variant group-hover:text-primary transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-on-surface">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-outline" />
                </button>
              ))}
            </div>

            <button 
              onClick={logout}
              className="w-full h-14 border border-secondary/20 text-secondary font-bold rounded-xl hover:bg-secondary/5 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </motion.div>
        )}
      </main>

      {/* Stock Detail Modal */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedStock(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-surface-container-low rounded-t-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-headline font-bold text-on-surface">{selectedStock.symbol}</h2>
                  <p className="text-on-surface-variant">{selectedStock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-on-surface">${selectedStock.price.toFixed(2)}</p>
                  <span className={cn(
                    "text-sm font-bold",
                    selectedStock.isPositive ? "text-primary" : "text-secondary"
                  )}>
                    {selectedStock.isPositive ? '+' : ''}{selectedStock.change}%
                  </span>
                </div>
              </div>

              {/* Chart Section */}
              <div className="mb-8">
                <div className="flex gap-2 mb-4">
                  {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedRange(range)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                        selectedRange === range 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                <div className="h-48 w-full bg-surface-container-low rounded-xl border border-outline-variant/10 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 8, fill: 'var(--color-outline)' }}
                        interval={selectedRange === '1D' ? 4 : selectedRange === '1M' ? 5 : 0}
                        dy={10}
                      />
                      <YAxis 
                        hide 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-surface-container-high)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                        labelStyle={{ color: 'var(--color-on-surface-variant)', marginBottom: '4px' }}
                      />
                      <Line 
                        key={selectedRange} // Force re-animation on range change
                        type="monotone" 
                        dataKey="price" 
                        stroke="var(--color-primary)" 
                        strokeWidth={3} 
                        dot={selectedRange === '1W' || selectedRange === '1D' ? { r: 4, fill: 'var(--color-primary)', strokeWidth: 0 } : false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-primary)' }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div>
                  <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-2">About</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {selectedStock.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface p-4 rounded-xl border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Market Cap</p>
                    <p className="text-sm font-bold text-on-surface">2.84T</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">P/E Ratio</p>
                    <p className="text-sm font-bold text-on-surface">28.45</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 h-14 bg-surface-container-highest text-on-surface font-bold rounded-xl active:scale-95 transition-all">
                  Sell
                </button>
                <button className="flex-1 h-14 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20">
                  Buy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-20px_40px_rgba(0,0,0,0.15)]">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          active={activeTab === 'Dashboard'} 
          onClick={() => setActiveTab('Dashboard')}
        />
        <NavItem 
          icon={<BarChart3 size={20} />} 
          label="Market" 
          active={activeTab === 'Market'} 
          onClick={() => setActiveTab('Market')}
        />
        <NavItem 
          icon={<ArrowLeftRight size={20} />} 
          label="Trade" 
          active={activeTab === 'Trade'} 
          onClick={() => setActiveTab('Trade')}
        />
        <NavItem 
          icon={<User size={20} />} 
          label="Profile" 
          active={activeTab === 'Profile'} 
          onClick={() => setActiveTab('Profile')}
        />
      </nav>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center transition-all px-4 py-2 rounded-xl relative group",
      active ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(61,229,48,0.1)]" : "text-on-surface-variant hover:text-on-surface"
    )}
  >
    {active && (
      <motion.div 
        layoutId="nav-glow"
        className="absolute inset-0 bg-primary/5 rounded-xl blur-md -z-10"
      />
    )}
    <div className="mb-1 group-active:scale-90 transition-transform">{icon}</div>
    <span className="font-body text-[10px] font-semibold uppercase tracking-wider">{label}</span>
  </button>
);
