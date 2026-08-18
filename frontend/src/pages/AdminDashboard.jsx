import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/ui/Header';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import SpiceThumbnail from '../components/ui/SpiceThumbnail';
import { SkeletonTable } from '../components/ui/Skeleton';
import RevenueTrendChart from '../components/charts/RevenueTrendChart';
import RevenueBreakdownChart from '../components/charts/RevenueBreakdownChart';

import { 
  ShieldCheck, Check, X, Truck, DollarSign, TrendingUp, Layers
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Data States
  const [pendingUsers, setPendingUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [ledgerStats, setLedgerStats] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [trends, setTrends] = useState([]);
  const [trendInterval, setTrendInterval] = useState('daily');

  // Interactive Panel & Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOmsModalOpen, setIsOmsModalOpen] = useState(false);
  const [statusUpdateVal, setStatusUpdateVal] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  
  // Logistics update inputs
  const [deliveryPartner, setDeliveryPartner] = useState('Rail-Express Placeholder');
  const [trackingId, setTrackingId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [packagingType, setPackagingType] = useState('Standard Gunnies');
  const [packagingCost, setPackagingCost] = useState('');
  
  // Quality update inputs
  const [moisturePercent, setMoisturePercent] = useState('');
  const [purityPercent, setPurityPercent] = useState('');
  const [qualityApproved, setQualityApproved] = useState(true);
  const [qualityRemarks, setQualityRemarks] = useState('');

  // Add/Edit Pricing Rule inputs
  const [pricingCategory, setPricingCategory] = useState('');
  const [marginPercent, setMarginPercent] = useState('');
  const [flatFee, setFlatFee] = useState('');
  const [volumeFeePercent, setVolumeFeePercent] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');

  // Notifications & Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(true);

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchData = async () => {
    try {
      const userRes = await api.get('/auth/pending-users');
      const orderRes = await api.get('/orders');
      const priceRes = await api.get('/products/admin/pricing-rules');
      const prodRes = await api.get('/products');
      const ledgerRes = await api.get('/analytics/ledger');
      const trendRes = await api.get(`/analytics/trends?interval=${trendInterval}`);

      if (userRes.data.success) setPendingUsers(userRes.data.data);
      if (orderRes.data.success) setOrders(orderRes.data.data);
      if (priceRes.data.success) setPricingRules(priceRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      
      if (ledgerRes.data.success) {
        setLedgerStats(ledgerRes.data.stats);
        setLedgerEntries(ledgerRes.data.data);
      }
      if (trendRes.data.success) {
        setTrends(trendRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trendInterval, activeTab]);

  // User approval controls
  const handleUserAction = async (targetUserId, action) => {
    try {
      const res = await api.post('/auth/approve', { targetUserId, action });
      if (res.data.success) {
        triggerToast(`Merchant registration ${action}d successfully.`, 'success');
        fetchData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Error executing action', 'error');
    }
  };

  // Pricing Rule setup
  const handleSavePricingRule = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/products/admin/pricing-rules', {
        category: pricingCategory,
        marginPercent: parseFloat(marginPercent) || 0,
        flatFee: parseFloat(flatFee) || 0,
        volumeFeePercent: parseFloat(volumeFeePercent) || 0,
        commissionPercent: parseFloat(commissionPercent) || 0,
      });

      if (res.data.success) {
        triggerToast('Margin policy updated and recomputed across inventory.', 'success');
        setPricingCategory('');
        setMarginPercent('');
        setFlatFee('');
        setVolumeFeePercent('');
        setCommissionPercent('');
        fetchData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Error saving pricing rules', 'error');
    }
  };

  // Quality evaluation logging
  const handleQualitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = await api.post(`/orders/${selectedOrder._id}/quality`, {
        moisturePercent: parseFloat(moisturePercent),
        purityPercent: parseFloat(purityPercent),
        approved: qualityApproved,
        remarks: qualityRemarks,
      });

      if (res.data.success) {
        triggerToast('Quality inspection recorded.', 'success');
        setMoisturePercent('');
        setPurityPercent('');
        setQualityRemarks('');
        fetchData();
        const updated = await api.get(`/orders/${selectedOrder._id}`);
        setSelectedOrder(updated.data.data);
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Error logging quality check', 'error');
    }
  };

  // Status transition pipeline
  const handleStatusTransition = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const payload = {
        status: statusUpdateVal,
        remarks: statusRemarks,
      };

      if (statusUpdateVal === 'packed' || statusUpdateVal === 'confirmed') {
        payload.deliveryPartner = deliveryPartner;
        payload.packagingType = packagingType;
        payload.packagingCost = parseFloat(packagingCost) || 0;
      }
      if (statusUpdateVal === 'dispatched') {
        payload.trackingId = trackingId;
        payload.expectedDeliveryDate = expectedDeliveryDate;
      }

      const res = await api.put(`/orders/${selectedOrder._id}/status`, payload);
      if (res.data.success) {
        triggerToast(`Status transitioned to ${statusUpdateVal}`, 'success');
        setStatusRemarks('');
        fetchData();
        setSelectedOrder(res.data.data);
        setIsOmsModalOpen(false);
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Transition blocked', 'error');
    }
  };

  const openOmsModal = (order) => {
    setSelectedOrder(order);
    setStatusUpdateVal(order.status);
    setIsOmsModalOpen(true);
  };

  // Filtered lists based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.productId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table Column Definitions
  const inventoryColumns = [
    {
      header: t('commodityItem'),
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
      header: t('category'),
      cell: (row) => <span className="font-semibold text-slate-300">{row.category}</span>,
    },
    {
      header: t('grade'),
      cell: (row) => <Badge variant={row.gradeClass}>{row.gradeClass}</Badge>,
    },
    {
      header: t('specs'),
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-300">{t('moisture')}: <strong>{row.moisturePercent}%</strong></div>
          <div className="text-slate-400">{t('purity')}: <strong>{row.purityPercent}%</strong></div>
        </div>
      ),
    },
    {
      header: t('supplierRate'),
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-slate-300">Rs. {row.rawPrice}</span>,
    },
    {
      header: t('buyerPrice'),
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-gold-gradient text-base">Rs. {row.liveMarketPrice}</span>,
    },
    {
      header: t('adminMarkup'),
      align: 'right',
      cell: (row) => <span className="font-mono text-emerald-400 font-semibold">+ Rs. {row.marginAmount}</span>,
    },
    {
      header: t('originLocation'),
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
      header: t('orderRef'),
      cell: (row) => <span className="font-mono font-bold text-amber-400">#{row._id.substring(18)}</span>,
    },
    {
      header: t('commodityItem'),
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <SpiceThumbnail category={row.productId?.category} name={row.productId?.name} size="small" />
          <span className="font-bold text-slate-200">{row.productId?.name || 'Agri Stock'}</span>
        </div>
      ),
    },
    {
      header: t('volumeQty'),
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-slate-200">{row.quantity} kg</span>,
    },
    {
      header: t('buyerTotal'),
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-gold-gradient">Rs. {row.totalAmount?.toLocaleString()}</span>,
    },
    {
      header: t('payoutRate'),
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-300">Rs. {(row.supplierPayoutPrice * row.quantity)?.toLocaleString()}</span>,
    },
    {
      header: t('status'),
      cell: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: t('omsAction'),
      align: 'center',
      cell: (row) => (
        <Button variant="outline" size="small" onClick={() => openOmsModal(row)}>
          OMS Control
        </Button>
      ),
    },
  ];

  const tabLabels = {
    dashboard: t('dashboardOverview'),
    orders: t('tradeOrdersOms'),
    inventory: t('activeInventory'),
    users: t('approvalsPipeline'),
    pricing: t('pricingMatrix'),
    ledger: t('revenueLedger'),
  };

  const sampleNotifications = [
    { title: 'New Stock Uploaded', message: 'Greenwood Spices uploaded 100kg Cardamom Bold.' },
    { title: 'Order Matched', message: 'Order #f97b1efdf4 routed to regional hub.' }
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        logout={logout}
        pendingApprovalsCount={pendingUsers.length}
        ordersCount={orders.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Persistent Header */}
        <Header
          user={user}
          activeTabLabel={tabLabels[activeTab]}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          notifications={sampleNotifications}
        />

        {/* Workspace Body */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* STAT CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title={t('grossRevenue')}
              value={ledgerStats ? `Rs. ${ledgerStats.totalGrossRevenue?.toLocaleString()}` : 'Rs. 0'}
              subtitle={t('accumulatedMargins')}
              icon={DollarSign}
              accentColor="gold"
              trend={{ value: 12.4, isPositive: true, period: 'vs last week' }}
            />
            <StatCard
              title={t('logisticsCost')}
              value={ledgerStats ? `Rs. ${ledgerStats.totalExpenses?.toLocaleString()}` : 'Rs. 0'}
              subtitle={t('freightPackaging')}
              icon={Truck}
              accentColor="amber"
              trend={{ value: 3.1, isPositive: false, period: 'vs last week' }}
            />
            <StatCard
              title={t('netProfitMargin')}
              value={ledgerStats ? `Rs. ${ledgerStats.totalNetProfit?.toLocaleString()}` : 'Rs. 0'}
              subtitle={t('netProfitSub')}
              icon={TrendingUp}
              accentColor="emerald"
              trend={{ value: 18.2, isPositive: true, period: 'vs last week' }}
            />
            <StatCard
              title={t('activeCommodities')}
              value={`${products.length} Batches`}
              subtitle={t('verifiedStocks')}
              icon={Layers}
              accentColor="cyan"
              trend={{ value: 8.5, isPositive: true, period: 'vs last period' }}
            />
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueTrendChart data={trends} interval={trendInterval} setInterval={setTrendInterval} />
                </div>
                <div>
                  <RevenueBreakdownChart stats={ledgerStats} />
                </div>
              </div>

              {/* Quick OMS Recent Orders */}
              <div className="panel-glass p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{t('tradeOrdersOms')}</h3>
                    <p className="text-xs text-slate-400">Latest commodity transactions passing through consolidation hubs.</p>
                  </div>
                  <Button variant="outline" size="small" onClick={() => setActiveTab('orders')}>
                    View All Orders
                  </Button>
                </div>
                <DataTable
                  columns={orderColumns}
                  data={filteredOrders.slice(0, 5)}
                  emptyMessage={t('noOrdersFound')}
                  onRowClick={openOmsModal}
                />
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS OMS HUB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gold-gradient">{t('tradeOrdersOms')}</h2>
                  <p className="text-xs text-slate-400">State machine pipeline control for anonymized B2B transactions.</p>
                </div>
              </div>

              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <DataTable
                  columns={orderColumns}
                  data={filteredOrders}
                  emptyMessage={t('noOrdersFound')}
                  onRowClick={openOmsModal}
                />
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gold-gradient">{t('activeInventory')}</h2>
                <p className="text-xs text-slate-400">Full administrative audit of supplier raw prices, buyer prices, and origins.</p>
              </div>

              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <DataTable
                  columns={inventoryColumns}
                  data={filteredProducts}
                  emptyMessage={t('noStocksFound')}
                />
              )}
            </div>
          )}

          {/* TAB 4: APPROVALS PIPELINE */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gold-gradient">{t('approvalsPipeline')}</h2>
                <p className="text-xs text-slate-400">Verify GST registration details before issuing Merchant IDs.</p>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="panel-glass p-12 text-center space-y-3">
                  <ShieldCheck size={36} className="text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-200">{t('noApprovalsFound')}</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {t('allReviewedMsg')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingUsers.map((pu) => (
                    <div key={pu._id} className="panel-glass p-5 space-y-3 relative border-amber-500/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant={pu.role}>{t(pu.role + 'Role') || pu.role}</Badge>
                          <h4 className="text-base font-bold text-slate-100 mt-2">{pu.companyName}</h4>
                          <span className="text-xs text-slate-400">{pu.email}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(pu.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1 font-mono">
                        <div><span className="text-slate-500">GSTIN:</span> <strong className="text-amber-400">{pu.gstNumber}</strong></div>
                        <div><span className="text-slate-500">Contact:</span> <span className="text-slate-300">{pu.contactNumber}</span></div>
                        <div className="truncate"><span className="text-slate-500">Address:</span> <span className="text-slate-400">{pu.address}</span></div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="primary"
                          size="small"
                          className="flex-1"
                          onClick={() => handleUserAction(pu._id, 'approve')}
                          icon={Check}
                        >
                          {t('approve')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="small"
                          className="flex-1"
                          onClick={() => handleUserAction(pu._id, 'reject')}
                          icon={X}
                        >
                          {t('reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PRICING MATRIX */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gold-gradient">{t('pricingMatrix')}</h2>
                  <p className="text-xs text-slate-400">Configure margin percentages and fixed markups per category.</p>
                </div>

                <div className="panel-glass p-6">
                  <div className="space-y-4">
                    {pricingRules.map((rule) => (
                      <div key={rule._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-200 text-sm">{rule.category}</span>
                          <div className="text-xs text-slate-400 mt-0.5 space-x-3">
                            <span>Margin: <strong className="text-amber-400">{rule.marginPercent}%</strong></span>
                            <span>Flat Markup: <strong className="text-emerald-400">Rs. {rule.flatFee}/kg</strong></span>
                          </div>
                        </div>
                        <Button variant="secondary" size="small" onClick={() => {
                          setPricingCategory(rule.category);
                          setMarginPercent(rule.marginPercent);
                          setFlatFee(rule.flatFee);
                          setVolumeFeePercent(rule.volumeFeePercent);
                          setCommissionPercent(rule.commissionPercent);
                        }}>
                          {t('editRule')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Form */}
              <div className="panel-glass p-6 h-fit border-amber-500/30 space-y-4">
                <h3 className="text-base font-bold text-slate-100">Set Margin Rule</h3>
                <form onSubmit={handleSavePricingRule} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1 uppercase">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cardamom, default"
                      value={pricingCategory}
                      onChange={(e) => setPricingCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-400 mb-1 uppercase">Margin %</label>
                      <input
                        type="number"
                        placeholder="5"
                        value={marginPercent}
                        onChange={(e) => setMarginPercent(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 mb-1 uppercase">Flat Fee (Rs.)</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={flatFee}
                        onChange={(e) => setFlatFee(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="gold" size="medium" className="w-full mt-2">
                    {t('applyPolicy')}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: REVENUE LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gold-gradient">{t('revenueLedger')}</h2>
                <p className="text-xs text-slate-400">Audited breakdown of gross revenue, logistics expenses, and net profit margins.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueTrendChart data={trends} interval={trendInterval} setInterval={setTrendInterval} />
                </div>
                <div>
                  <RevenueBreakdownChart stats={ledgerStats} />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* OMS CONTROL PORTAL MODAL */}
      <Modal
        isOpen={isOmsModalOpen}
        onClose={() => setIsOmsModalOpen(false)}
        title="OMS Order State Control Portal"
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs">
            {/* Order Summary Header */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">ORDER ID</span>
                <strong className="text-amber-400">#{selectedOrder._id.substring(18)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">VOLUME</span>
                <strong className="text-slate-200">{selectedOrder.quantity} kg</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">BUYER TOTAL</span>
                <strong className="text-emerald-400">Rs. {selectedOrder.totalAmount?.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">STATUS</span>
                <Badge variant={selectedOrder.status}>{selectedOrder.status}</Badge>
              </div>
            </div>

            {/* Transition Pipeline Form */}
            <form onSubmit={handleStatusTransition} className="space-y-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Transition Status Pipeline</h4>
              
              <div>
                <label className="block text-slate-400 mb-1">Select Pipeline Target Status</label>
                <select
                  value={statusUpdateVal}
                  onChange={(e) => setStatusUpdateVal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold"
                >
                  <option value="placed">Placed</option>
                  <option value="routed">Routed (Notify Supplier & Buyer)</option>
                  <option value="pending_quality_approval">Pending Quality Control (Consolidation hub)</option>
                  <option value="confirmed">Confirmed (Fix margins & log Ledger)</option>
                  <option value="packed">Packed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {(statusUpdateVal === 'packed' || statusUpdateVal === 'confirmed') && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-3">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Logistics & Freight Parameters</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Delivery Provider</label>
                      <input type="text" value={deliveryPartner} onChange={(e) => setDeliveryPartner(e.target.value)} className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Packaging Cost (Rs.)</label>
                      <input type="number" placeholder="500" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Action Remarks</label>
                <input
                  type="text"
                  placeholder="Transition note"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <Button type="submit" variant="gold" size="medium" className="w-full">
                {t('submitPipeline')}
              </Button>
            </form>

            {/* Quality Inspection Log Form */}
            <form onSubmit={handleQualitySubmit} className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Log Hub Quality Test Results</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Moisture Spec (%)</label>
                  <input type="number" step="0.1" required value={moisturePercent} onChange={(e) => setMoisturePercent(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Purity Spec (%)</label>
                  <input type="number" step="0.1" required value={purityPercent} onChange={(e) => setPurityPercent(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Inspector Outcome</label>
                <select value={qualityApproved ? 'true' : 'false'} onChange={(e) => setQualityApproved(e.target.value === 'true')} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-semibold">
                  <option value="true">Approved (Passes grade specs)</option>
                  <option value="false">Rejected (Fails quality parameters)</option>
                </select>
              </div>

              <Button type="submit" variant="primary" size="medium" className="w-full">
                {t('recordQuality')}
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
