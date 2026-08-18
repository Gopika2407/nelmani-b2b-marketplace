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
import { ShoppingBag, Info, Truck, RefreshCw, ShoppingCart, Layers, Landmark } from 'lucide-react';

const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  
  // States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchTerm, setSearchTerm] = useState('');

  // Order placing modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
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
      const prodRes = await api.get('/products');
      const orderRes = await api.get('/orders');

      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (orderRes.data.success) setOrders(orderRes.data.data);
    } catch (err) {
      console.error('Error fetching buyer data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCheckout = (prod) => {
    setSelectedProduct(prod);
    setQuantity(prod.buyerMOQ ? String(prod.buyerMOQ) : '');
    setIsCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!selectedProduct) return;

    if (parseInt(quantity) < selectedProduct.buyerMOQ) {
      const msg = `Quantity cannot be less than the MOQ of ${selectedProduct.buyerMOQ} kg`;
      setError(msg);
      triggerToast(msg, 'error');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/orders', {
        productId: selectedProduct._id,
        quantity: parseInt(quantity),
        shippingAddress,
      });

      if (res.data.success) {
        triggerToast('Order placed successfully! Routed to hidden Admin OMS pipeline.', 'success');
        setQuantity('');
        setShippingAddress('');
        setSelectedProduct(null);
        setIsCheckoutModalOpen(false);
        fetchData();
        setTimeout(() => setActiveTab('orders'), 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpent = orders
    .filter(o => o.status !== 'rejected' && o.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const productColumns = [
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
      header: t('originLocation'),
      cell: (row) => <span className="text-xs font-semibold text-slate-300">{row.region}</span>,
    },
    {
      header: t('buyerPrice'),
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-gold-gradient text-base">Rs. {row.liveMarketPrice} / kg</span>,
    },
    {
      header: "MOQ",
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-300 font-semibold">{row.buyerMOQ} kg</span>,
    },
    {
      header: t('actions'),
      align: 'center',
      cell: (row) => (
        <Button variant="gold" size="small" onClick={() => openCheckout(row)} icon={ShoppingCart}>
          {t('placeOrder')}
        </Button>
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
          <span className="font-bold text-slate-200">{row.productId?.name || 'Agri Commodity'}</span>
        </div>
      ),
    },
    {
      header: t('volumeQty'),
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-slate-200">{row.quantity} kg</span>,
    },
    {
      header: "Spot Rate",
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-300">Rs. {row.negotiatedPrice} / kg</span>,
    },
    {
      header: t('buyerTotal'),
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-gold-gradient">Rs. {row.totalAmount?.toLocaleString()}</span>,
    },
    {
      header: t('status'),
      cell: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: "Tracking",
      cell: (row) => (
        <div className="text-xs text-slate-400">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <Truck size={12} className="text-cyan-400" />
            {row.deliveryPartner}
          </div>
          {row.trackingId && <div className="text-[10px] text-slate-500 font-mono">Ref: {row.trackingId}</div>}
        </div>
      ),
    },
  ];

  const tabLabels = {
    marketplace: t('spotMarketplace'),
    orders: t('myOrders'),
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
              title={t('spotBatches')}
              value={`${products.length} Commodities`}
              subtitle={t('verifiedStocks')}
              icon={Layers}
              accentColor="cyan"
              trend={{ value: 6.4, isPositive: true, period: 'vs last week' }}
            />
            <StatCard
              title={t('myOrdersPlaced')}
              value={`${orders.length} Orders`}
              subtitle={t('myOrders')}
              icon={ShoppingBag}
              accentColor="gold"
            />
            <StatCard
              title={t('capitalTransacted')}
              value={`Rs. ${totalSpent.toLocaleString()}`}
              subtitle={t('excludesRejected')}
              icon={Landmark}
              accentColor="emerald"
              trend={{ value: 22.1, isPositive: true, period: 'vs last period' }}
            />
          </div>

          {/* TAB 1: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-cyan-300">{t('spotMarketplace')}</h2>
                  <p className="text-xs text-slate-400">Verified agri-commodity stocks with dynamic margin pricing.</p>
                </div>
                <Button variant="secondary" size="small" onClick={fetchData} icon={RefreshCw}>
                  {t('refreshPrices')}
                </Button>
              </div>

              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <DataTable
                  columns={productColumns}
                  data={filteredProducts}
                  emptyMessage={t('noItemsFound')}
                />
              )}
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300/90 flex items-start gap-3">
                <Info size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  {t('buyerPrivacyNotice')}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-cyan-300">{t('myOrders')}</h2>
                <p className="text-xs text-slate-400">Track pipeline status transitions, quality approvals, and courier references.</p>
              </div>

              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <DataTable
                  columns={orderColumns}
                  data={orders}
                  emptyMessage={t('noOrdersFound')}
                />
              )}
            </div>
          )}

        </main>
      </div>

      {/* CHECKOUT MODAL */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Submit Trade Purchase Order"
        maxWidth="max-w-lg"
      >
        {selectedProduct && (
          <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
            {/* Selected Product Summary Header */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SpiceThumbnail category={selectedProduct.category} name={selectedProduct.name} size="large" />
                <div>
                  <div className="font-bold text-slate-100 text-sm">{selectedProduct.name}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Live Rate: <strong className="text-gold-gradient">Rs. {selectedProduct.liveMarketPrice} / kg</strong>
                  </div>
                </div>
              </div>
              <Badge variant={selectedProduct.gradeClass}>{selectedProduct.gradeClass}</Badge>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-400 mb-1 uppercase">
                Order Quantity (kg) — Min. {selectedProduct.buyerMOQ} kg
              </label>
              <input
                type="number"
                required
                min={selectedProduct.buyerMOQ}
                placeholder={`Min. ${selectedProduct.buyerMOQ} kg`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-base font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1 uppercase">
                Delivery / Warehouse Destination Address
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter complete delivery coordinates"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              />
            </div>

            {/* Total Cost Estimate Calculation */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 flex justify-between items-center">
              <span className="font-semibold text-slate-400">Total Purchase Price:</span>
              <span className="text-lg font-bold font-mono text-gold-gradient">
                Rs. {quantity ? (parseFloat(quantity) * selectedProduct.liveMarketPrice).toLocaleString() : '0'}
              </span>
            </div>

            <Button type="submit" variant="gold" size="large" loading={submitting} className="w-full mt-2">
              {t('submitPurchase')}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default BuyerDashboard;
