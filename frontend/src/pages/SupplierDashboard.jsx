import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/ui/Header';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import SpiceThumbnail from '../components/ui/SpiceThumbnail';
import SkeletonCard, { SkeletonTable } from '../components/ui/Skeleton';
import { Sprout, PackagePlus, Table, Landmark, HelpCircle, Layers, CheckCircle2, Truck, Info, Plus } from 'lucide-react';

const SupplierDashboard = () => {
  const { user, logout } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' | 'orders' | 'add'
  const [searchTerm, setSearchTerm] = useState('');

  // Input states for new product stock
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cardamom');
  const [gradeClass, setGradeClass] = useState('Grade A');
  const [rawPrice, setRawPrice] = useState('');
  const [rawMOQ, setRawMOQ] = useState('');
  const [origin, setOrigin] = useState('');
  const [region, setRegion] = useState('');
  const [moisturePercent, setMoisturePercent] = useState('');
  const [purityPercent, setPurityPercent] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchData = async () => {
    try {
      const stockRes = await api.get('/products?myStock=true');
      const orderRes = await api.get('/orders');
      
      if (stockRes.data.success) setStocks(stockRes.data.data);
      if (orderRes.data.success) setOrders(orderRes.data.data);
    } catch (err) {
      console.error('Error fetching supplier data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/products', {
        name,
        category,
        gradeClass,
        rawPrice: parseFloat(rawPrice),
        rawMOQ: parseInt(rawMOQ),
        origin,
        region,
        moisturePercent: parseFloat(moisturePercent),
        purityPercent: parseFloat(purityPercent),
      });

      if (res.data.success) {
        triggerToast('Spice commodity batch registered and published to spot marketplace!', 'success');
        setName('');
        setRawPrice('');
        setRawMOQ('');
        setOrigin('');
        setRegion('');
        setMoisturePercent('');
        setPurityPercent('');
        fetchData();
        setTimeout(() => setActiveTab('stocks'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit stock batch');
      triggerToast(err.response?.data?.message || 'Failed to submit stock batch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate earnings KPIs
  const activeOrdersCount = orders.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status)).length;
  const totalPayout = orders
    .filter(o => o.status !== 'rejected' && o.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr.supplierPayoutTotal || 0), 0);

  const filteredStocks = stocks.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stockColumns = [
    {
      header: 'Commodity Batch',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <SpiceThumbnail category={row.category} name={row.name} size="medium" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">{row.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">ID: #{row._id.substring(18)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => <span className="font-semibold text-slate-300">{row.category}</span>,
    },
    {
      header: 'Quality Grade',
      cell: (row) => <Badge variant={row.gradeClass}>{row.gradeClass}</Badge>,
    },
    {
      header: 'Specs',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-300">Moisture: <strong>{row.moisturePercent}%</strong></div>
          <div className="text-slate-400">Purity: <strong>{row.purityPercent}%</strong></div>
        </div>
      ),
    },
    {
      header: 'Raw Payout Rate',
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-emerald-400">Rs. {row.rawPrice} / kg</span>,
    },
    {
      header: 'Raw MOQ',
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-300 font-semibold">{row.rawMOQ} kg</span>,
    },
    {
      header: 'Origin Location',
      cell: (row) => (
        <div className="text-xs max-w-xs truncate" title={row.origin}>
          <span className="text-slate-300 font-semibold">{row.region}</span>
          <div className="text-[11px] text-slate-500 truncate">{row.origin}</div>
        </div>
      ),
    },
  ];

  const orderColumns = [
    {
      header: 'Order Ref ID',
      cell: (row) => <span className="font-mono font-bold text-emerald-400">#{row._id.substring(18)}</span>,
    },
    {
      header: 'Matched Product',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <SpiceThumbnail category={row.productId?.category} name={row.productId?.name} size="small" />
          <span className="font-bold text-slate-200">{row.productId?.name || 'Agri Commodity'}</span>
        </div>
      ),
    },
    {
      header: 'Consolidation Qty',
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-slate-200">{row.quantity} kg</span>,
    },
    {
      header: 'Payout Rate',
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-300">Rs. {row.supplierPayoutPrice} / kg</span>,
    },
    {
      header: 'Pledged Payout Total',
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-emerald-400">Rs. {row.supplierPayoutTotal?.toLocaleString()}</span>,
    },
    {
      header: 'Fulfillment Status',
      cell: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Logistics Courier',
      cell: (row) => (
        <div className="text-xs text-slate-400">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <Truck size={12} className="text-emerald-400" />
            {row.deliveryPartner}
          </div>
          {row.trackingId && <div className="text-[10px] text-slate-500 font-mono">Ref: {row.trackingId}</div>}
        </div>
      ),
    },
  ];

  const tabLabels = {
    stocks: 'My Inventory',
    orders: 'Trade Matches',
    add: 'Add Spice Batch',
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        logout={logout}
        ordersCount={orders.length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          user={user}
          activeTabLabel={tabLabels[activeTab]}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              title="Commodity Stock Batches"
              value={`${stocks.length} Items`}
              subtitle="Registered spice inventory"
              icon={Layers}
              accentColor="emerald"
              trend={{ value: 5.2, isPositive: true, period: 'vs last week' }}
            />
            <StatCard
              title="Inbound Trade Matches"
              value={`${activeOrdersCount} Active`}
              subtitle="Pending hub delivery"
              icon={Sprout}
              accentColor="amber"
            />
            <StatCard
              title="Total Payout Accrued"
              value={`Rs. ${totalPayout.toLocaleString()}`}
              subtitle="Excludes rejected trades"
              icon={Landmark}
              accentColor="emerald"
              trend={{ value: 14.8, isPositive: true, period: 'vs last week' }}
            />
          </div>

          {/* TAB 1: STOCKS */}
          {activeTab === 'stocks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-emerald-gradient">Commodity Batches Under Custody</h2>
                  <p className="text-xs text-slate-400">All registered spice stocks uploaded from your farm or processing unit.</p>
                </div>
                <Button variant="primary" size="medium" onClick={() => setActiveTab('add')} icon={Plus}>
                  Add Spice Batch
                </Button>
              </div>

              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <DataTable
                  columns={stockColumns}
                  data={filteredStocks}
                  emptyMessage="No spice stock batches uploaded yet. Click 'Add Spice Batch' to list your inventory."
                />
              )}
            </div>
          )}

          {/* TAB 2: TRADE ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/90 flex items-start gap-3">
                <HelpCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-400">B2B Anonymity Rule:</strong> Buyer identities and contact info are hidden. Deliver matched stock to the nearest rail consolidation point reference code before the packing deadline.
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-emerald-gradient">Matched B2B Trade Shipments</h2>
                <p className="text-xs text-slate-400">Orders matched by the platform admin for consolidated fulfillment.</p>
              </div>

              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <DataTable
                  columns={orderColumns}
                  data={orders}
                  emptyMessage="No routed trade matches currently assigned."
                />
              )}
            </div>
          )}

          {/* TAB 3: ADD SPICE BATCH */}
          {activeTab === 'add' && (
            <div className="panel-glass p-8 max-w-3xl mx-auto space-y-6 border-emerald-500/30">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-emerald-gradient">Register Commodity Batch</h2>
                  <p className="text-xs text-slate-400">Publish your spice stock to the Nelmani B2B spot marketplace.</p>
                </div>
                <SpiceThumbnail category={category} name={name} size="large" />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddStock} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 mb-1 uppercase">
                    Spice / Stock Batch Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardamom Green Bold 8mm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1 uppercase">Spice Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold"
                    >
                      <option value="Cardamom">Cardamom</option>
                      <option value="Black Pepper">Black Pepper</option>
                      <option value="Turmeric">Turmeric</option>
                      <option value="Clove">Clove</option>
                      <option value="Ginger">Ginger</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1 uppercase">Quality Grade</label>
                    <select
                      value={gradeClass}
                      onChange={(e) => setGradeClass(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold"
                    >
                      <option value="Grade A">Grade A (Premium Export)</option>
                      <option value="Grade B">Grade B (Standard Market)</option>
                      <option value="Grade C">Grade C (Local Mix)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1 uppercase">Your Raw Payout Price (Rs. / kg)</label>
                    <input
                      type="number"
                      required
                      placeholder="Price paid to you directly"
                      value={rawPrice}
                      onChange={(e) => setRawPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1 uppercase">Your Raw MOQ (kg)</label>
                    <input
                      type="number"
                      required
                      placeholder="Minimum order quantity"
                      value={rawMOQ}
                      onChange={(e) => setRawMOQ(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1 uppercase">Moisture Spec (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Moisture %"
                      value={moisturePercent}
                      onChange={(e) => setMoisturePercent(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1 uppercase">Purity Spec (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Purity %"
                      value={purityPercent}
                      onChange={(e) => setPurityPercent(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1 uppercase">
                    Exact Farm / Producer Location (Hidden from Buyers)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full village, district, state address"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1 uppercase">
                    General Region (Visible to Buyers)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Idukki, Kerala"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>

                <Button type="submit" variant="primary" loading={submitting} className="w-full mt-2" size="large">
                  Publish Commodity Batch
                </Button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default SupplierDashboard;
