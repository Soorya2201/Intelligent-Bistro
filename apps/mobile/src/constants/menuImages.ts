import { ImageSourcePropType } from 'react-native';

// Single source of truth for food photography.
// Every component that renders item images imports from here.
export const MENU_IMAGES: Record<string, ImageSourcePropType> = {
  // ── Starters ───────────────────────────────────────────────────────────────
  'tuna-tartare':            require('../../../../assets/Tuna Tartare.jpeg'),
  'chicken-wings':           require('../../../../assets/Buffalo chicken wings.jpeg'),

  // ── Mains ──────────────────────────────────────────────────────────────────
  'spicy-chicken-sandwich':  require('../../../../assets/Spicy Chicken Sandwich.jpeg'),
  'spicy-chicken':           require('../../../../assets/Spicy Chicken Sandwich.jpeg'),
  'classic-bistro-burger':   require('../../../../assets/Classic Bistro Burger.jpeg'),
  'classic-burger':          require('../../../../assets/Classic Bistro Burger.jpeg'),
  'wagyu-smash-burger':      require('../../../../assets/Wagyu smash Burger.jpeg'),
  'truffle-mushroom-burger': require('../../../../assets/Mushroom swiss burger.jpeg'),
  'mushroom-burger':         require('../../../../assets/Mushroom swiss burger.jpeg'),
  'vegan-burger':            require('../../../../assets/Beyond bistro Burger.jpeg'),
  'bbq-pulled-pork':         require('../../../../assets/Smokehouse BBQ Burger.jpeg'),
  'bbq-burger':              require('../../../../assets/Smokehouse BBQ Burger.jpeg'),

  // ── Sides ──────────────────────────────────────────────────────────────────
  'truffle-fries':           require('../../../../assets/truffle fries.jpeg'),
  'sweet-potato-fries':      require('../../../../assets/sweet potato fries.jpeg'),
  'caesar-side':             require('../../../../assets/garden side salad.jpeg'),
  'side-salad':              require('../../../../assets/garden side salad.jpeg'),
  'onion-rings':             require('../../../../assets/onion Rings.jpeg'),
  'coleslaw':                require('../../../../assets/House Coleslaw.jpeg'),

  // ── Sides (extended) ───────────────────────────────────────────────────────
  'mac-cheese':              require('../../../../assets/mac and Cheese.jpg'),

  // ── Mains (extended) ───────────────────────────────────────────────────────
  'veggie-grain-bowl':       require('../../../../assets/Veggie Grain Bowl.png'),

  // ── Drinks ─────────────────────────────────────────────────────────────────
  'fresh-lemonade':          require('../../../../assets/Fresh Lemonade.jpeg'),
  'lemonade':                require('../../../../assets/Fresh Lemonade.jpeg'),
  'iced-tea':                require('../../../../assets/professional-food-photography-iced-tea-w_kwJ2A0h-UcqkyFQqCO4GAg_6jMsN8xHQxO_pTpK76cipg_sd.jpeg'),
  'sparkling-water':         require('../../../../assets/sparkling water.jpeg'),
  'craft-cola':              require('../../../../assets/classic soda.jpeg'),
  'classic-soda':            require('../../../../assets/classic soda.jpeg'),
  'still-water':             require('../../../../assets/Still Water (Large).jpeg'),
  'large-water':             require('../../../../assets/Still Water (Large).jpeg'),
  'root-beer-float':         require('../../../../assets/Root Beer Float.jpg'),

  // ── Desserts ───────────────────────────────────────────────────────────────
  'warm-brownie':            require('../../../../assets/Warm chocolate brownie.jpeg'),
  'vanilla-cheesecake':      require('../../../../assets/Newyork Cheesecake.jpeg'),
  'gelato-2-scoops':         require('../../../../assets/Seasonal gelato.jpeg'),
};
