import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const TIER_COLORS = {
  Starter: { bg: 'from-green-400 to-emerald-500', ring: 'ring-green-200', badge: 'bg-green-100 text-green-700' },
  Essential: { bg: 'from-blue-400 to-indigo-500', ring: 'ring-blue-200', badge: 'bg-blue-100 text-blue-700' },
  Advanced: { bg: 'from-purple-400 to-violet-500', ring: 'ring-purple-200', badge: 'bg-purple-100 text-purple-700' },
  Elite: { bg: 'from-amber-400 to-orange-500', ring: 'ring-amber-200', badge: 'bg-amber-100 text-amber-700' },
};

const StudentShop = () => {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);  // itemId being purchased
  const [confirmItem, setConfirmItem] = useState(null); // item to confirm
  const [filter, setFilter] = useState('all'); // all, affordable, owned

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    try {
      const { data } = await api.get('/shop/items');
      setShopData(data);
    } catch (err) {
      toast.error('Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (item) => {
    setBuying(item.id);
    try {
      const { data } = await api.post(`/shop/buy/${item.id}`);
      toast.success(data.message, { icon: item.emoji });
      setConfirmItem(null);
      // Update local state
      setShopData(prev => ({
        ...prev,
        totalXP: data.remainingXP,
        ownedCount: data.ownedItems.length,
        items: prev.items.map(i =>
          i.id === item.id
            ? { ...i, owned: true, canAfford: true }
            : { ...i, canAfford: data.remainingXP >= i.cost }
        )
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setBuying(null);
    }
  };

  // Filter items
  const getFilteredItems = () => {
    if (!shopData) return [];
    switch (filter) {
      case 'affordable': return shopData.items.filter(i => !i.owned && i.canAfford);
      case 'owned': return shopData.items.filter(i => i.owned);
      default: return shopData.items;
    }
  };

  // Group items by tier
  const groupByTier = (items) => {
    const tiers = {};
    items.forEach(item => {
      if (!tiers[item.tier]) tiers[item.tier] = [];
      tiers[item.tier].push(item);
    });
    return tiers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-gray-400 tracking-widest uppercase">Loading Shop...</p>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();
  const groupedItems = groupByTier(filteredItems);
  const ownedItems = shopData.items.filter(i => i.owned);
  const completionPercent = Math.round((shopData.ownedCount / shopData.totalItems) * 100);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {/* <div>
          <h1 className="text-2xl font-bold text-gray-900">🎒 Go-Bag Shop</h1>
          <p className="text-gray-500 text-sm mt-1">Build your emergency survival kit by spending XP.</p>
        </div> */}
        <Link
          to="/dashboard/student"
          className="text-sm font-bold text-gray-400 hover:text-gray-600 transition"
        >
          ← Back to Lobby
        </Link>
      </div>

      {/* MY GO-BAG DISPLAY */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 hover:shadow-md transition">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🎒 My Go-Bag
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                {shopData.ownedCount}/{shopData.totalItems} Items
              </span>
            </h2>
            <p className="text-gray-400 text-xs mt-1">Collect all items to complete your survival kit!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <span className="text-sm">💰</span>
              <span className="font-bold text-gray-700 text-lg">{shopData.totalXP} XP</span>
            </div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
            <span>Collection Progress</span>
            <span>{completionPercent}% Complete</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Owned Items Grid */}
        {ownedItems.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {ownedItems.map(item => (
              <div
                key={item.id}
                className="group relative bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 hover:border-blue-300 hover:shadow-sm transition cursor-default"
                title={item.name}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs font-bold text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-300 text-sm">Your bag is empty. Start collecting items below!</p>
          </div>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All Items', count: shopData.totalItems },
          { key: 'affordable', label: 'Can Afford', count: shopData.items.filter(i => !i.owned && i.canAfford).length },
          { key: 'owned', label: 'Owned', count: shopData.ownedCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === tab.key
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* SHOP ITEMS BY TIER */}
      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">🏜️</span>
          <p className="font-bold text-gray-400">No items match this filter.</p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([tier, items]) => {
          const tierStyle = TIER_COLORS[tier] || TIER_COLORS.Starter;
          return (
            <div key={tier} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${tierStyle.badge}`}>
                  {tier} Tier
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 ${item.owned
                        ? 'border-green-200 opacity-75'
                        : item.canAfford
                          ? 'border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1'
                          : 'border-gray-100 opacity-50'
                      }`}
                  >
                    {/* Item Header */}
                    <div className={`h-24 bg-gray-50 border-b border-gray-100 flex items-center justify-center relative`}>
                      <span className="text-5xl filter drop-shadow-md">{item.emoji}</span>
                      {item.owned && (
                        <div className="absolute top-2 right-2 bg-green-100 rounded-full px-2.5 py-1 flex items-center gap-1">
                          <span className="text-green-700 text-xs font-bold">✓ OWNED</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-gray-100 rounded-full px-2.5 py-1">
                        <span className="text-white text-xs font-bold">{item.cost} XP</span>
                      </div>
                    </div>

                    {/* Item Body */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{item.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">{item.description}</p>

                      {item.owned ? (
                        <div className="w-full text-center py-3 rounded-xl bg-green-50 text-green-600 font-bold text-sm border border-green-100">
                          ✅ In Your Go-Bag
                        </div>
                      ) : item.canAfford ? (
                        <button
                          onClick={() => setConfirmItem(item)}
                          disabled={buying === item.id}
                          className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buying === item.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Purchasing...
                            </span>
                          ) : (
                            `🛒 Buy for ${item.cost} XP`
                          )}
                        </button>
                      ) : (
                        <div className="w-full text-center py-3 rounded-xl bg-gray-50 text-gray-400 font-bold text-sm border border-gray-100">
                          🔒 Need {item.cost - shopData.totalXP} more XP
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* PURCHASE CONFIRMATION MODAL */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-200 h-28 flex items-center justify-center">
              <span className="text-7xl filter drop-shadow-lg">{confirmItem.emoji}</span>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">
                Purchase {confirmItem.name}?
              </h3>
              <p className="text-gray-400 text-sm text-center mb-6">{confirmItem.description}</p>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current XP</span>
                  <span className="font-bold text-gray-700">{shopData.totalXP} XP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Item Cost</span>
                  <span className="font-bold text-red-500">-{confirmItem.cost} XP</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                  <span className="font-bold text-gray-700">Remaining</span>
                  <span className="font-bold text-blue-600">{shopData.totalXP - confirmItem.cost} XP</span>
                </div>
              </div>

              <button
                onClick={() => handleBuy(confirmItem)}
                disabled={buying === confirmItem.id}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {buying === confirmItem.id ? (
                  <>
                    <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>✅ Confirm Purchase</>
                )}
              </button>
              <button
                onClick={() => setConfirmItem(null)}
                className="w-full mt-3 py-2 text-gray-400 text-sm font-medium hover:text-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentShop;
