import User from '../models/user.model.js';

// Hardcoded Shop Catalog — Disaster Preparedness Go-Bag Items
const SHOP_ITEMS = [
  // Tier 1: Starter (100-200 XP)
  { id: 'whistle', name: 'Emergency Whistle', emoji: '📢', cost: 100, tier: 'Starter', description: 'Signal for help during emergencies.' },
  { id: 'compass', name: 'Compass', emoji: '🧭', cost: 150, tier: 'Starter', description: 'Navigate safely when GPS fails.' },
  { id: 'flashlight', name: 'Flashlight', emoji: '🔦', cost: 200, tier: 'Starter', description: 'Light the way during power outages.' },

  // Tier 2: Essential (250-400 XP)
  { id: 'rations', name: 'Emergency Rations', emoji: '🥫', cost: 250, tier: 'Essential', description: '72-hour food supply for survival.' },
  { id: 'firstaid', name: 'First Aid Kit', emoji: '🩹', cost: 300, tier: 'Essential', description: 'Treat injuries in the field.' },
  { id: 'rope', name: 'Rescue Rope', emoji: '🪢', cost: 350, tier: 'Essential', description: 'Secure areas and assist in rescues.' },
  { id: 'extinguisher', name: 'Fire Extinguisher', emoji: '🧯', cost: 400, tier: 'Essential', description: 'Combat small fires before they spread.' },

  // Tier 3: Advanced (450-600 XP)
  { id: 'boots', name: 'Safety Boots', emoji: '🥾', cost: 450, tier: 'Advanced', description: 'Protect your feet on rough terrain.' },
  { id: 'radio', name: 'Emergency Radio', emoji: '📻', cost: 500, tier: 'Advanced', description: 'Stay tuned to emergency broadcasts.' },
  { id: 'vest', name: 'Safety Vest', emoji: '🦺', cost: 600, tier: 'Advanced', description: 'Be visible during rescue operations.' },

  // Tier 4: Elite (800-1500 XP)
  { id: 'backpack', name: 'Survival Backpack', emoji: '🎒', cost: 800, tier: 'Elite', description: 'Carry all your survival gear in one place.' },
  { id: 'satphone', name: 'Satellite Phone', emoji: '📡', cost: 1000, tier: 'Elite', description: 'Communicate when cell towers are down.' },
  { id: 'shelter', name: 'Emergency Shelter', emoji: '🏕️', cost: 1500, tier: 'Elite', description: 'Portable shelter for extreme conditions.' },
];

// 1. GET /shop/items — Get all shop items with ownership status
export const getShopItems = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('totalXP ownedItems');
    const ownedSet = new Set(user.ownedItems || []);

    const items = SHOP_ITEMS.map(item => ({
      ...item,
      owned: ownedSet.has(item.id),
      canAfford: user.totalXP >= item.cost
    }));

    res.json({
      items,
      totalXP: user.totalXP,
      ownedCount: ownedSet.size,
      totalItems: SHOP_ITEMS.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. POST /shop/buy/:itemId — Purchase an item
export const buyItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user.id);

    // Validate item exists
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in shop.' });
    }

    // Check if already owned
    if (user.ownedItems && user.ownedItems.includes(itemId)) {
      return res.status(400).json({ message: 'You already own this item!' });
    }

    // Check if can afford
    if (user.totalXP < item.cost) {
      return res.status(400).json({ 
        message: `Not enough XP! You need ${item.cost - user.totalXP} more XP.` 
      });
    }

    // Deduct XP and add item
    user.totalXP -= item.cost;
    if (!user.ownedItems) user.ownedItems = [];
    user.ownedItems.push(itemId);
    await user.save();

    res.json({
      message: `${item.emoji} ${item.name} purchased!`,
      item,
      remainingXP: user.totalXP,
      ownedItems: user.ownedItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. GET /shop/my-bag — Get student's Go-Bag (owned items with details)
export const getMyBag = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('totalXP ownedItems name');
    const ownedSet = new Set(user.ownedItems || []);

    const bagItems = SHOP_ITEMS.filter(item => ownedSet.has(item.id));
    const totalValue = bagItems.reduce((sum, item) => sum + item.cost, 0);

    res.json({
      name: user.name,
      totalXP: user.totalXP,
      bagItems,
      totalValue,
      ownedCount: bagItems.length,
      totalItems: SHOP_ITEMS.length,
      completionPercent: Math.round((bagItems.length / SHOP_ITEMS.length) * 100)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
