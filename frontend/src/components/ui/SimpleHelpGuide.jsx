import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HelpCircle, Package, Truck, CheckCircle2, ShoppingBag, MapPin, X } from 'lucide-react';

const SimpleHelpGuide = ({ role = 'buyer' }) => {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const guides = {
    supplier: {
      titleEn: "How to Sell Your Crops (Simple 3-Step Guide)",
      titleTa: "பயிர்களை விற்பனை செய்வது எப்படி? (எளிய 3 படிகள்)",
      steps: [
        {
          num: "1",
          icon: Package,
          titleEn: "Add Your Crop",
          titleTa: "1. பயிரை சேர்க்கவும்",
          descEn: "Click 'Add New Spice Crop', enter crop name, your weight (kg), and price.",
          descTa: "'புதிய பயிர் சேர்' பொத்தானை அழுத்தி பயிர் பெயர், எடை மற்றும் விலையை உள்ளிடவும்.",
          color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
        },
        {
          num: "2",
          icon: Truck,
          titleEn: "Deliver Stock",
          titleTa: "2. லாரியில் அனுப்பவும்",
          descEn: "When an order comes, drop your crop bags at the nearest rail/bus transport center.",
          descTa: "ஆணை வந்தவுடன், உங்கள் பயிர் மூட்டைகளை அருகிலுள்ள போக்குவரத்து மையத்தில் சேர்க்கவும்.",
          color: "border-amber-500/40 text-amber-400 bg-amber-500/10"
        },
        {
          num: "3",
          icon: CheckCircle2,
          titleEn: "Get Paid",
          titleTa: "3. பணம் பெறவும்",
          descEn: "After quality test, your total earnings are paid straight to your bank account!",
          descTa: "தர சோதனைக்குப் பின், உங்கள் மொத்த விற்பனைப் பணம் உங்கள் கணக்கில் வழங்கப்படும்!",
          color: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10"
        }
      ]
    },
    buyer: {
      titleEn: "How to Buy Spices (Simple 3-Step Guide)",
      titleTa: "பொருட்களை வாங்குவது எப்படி? (எளிய 3 படிகள்)",
      steps: [
        {
          num: "1",
          icon: ShoppingBag,
          titleEn: "Select Spice Crop",
          titleTa: "1. பொருளைத் தேர்ந்தெடுக்கவும்",
          descEn: "Look at the list below for cardamom, pepper, turmeric, or chili.",
          descTa: "கீழேயுள்ள பட்டியலில் ஏலக்காய், மிளகு, மஞ்சள் அல்லது மிளகாயைப் பாருங்கள்.",
          color: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10"
        },
        {
          num: "2",
          icon: MapPin,
          titleEn: "Click 'Buy Now'",
          titleTa: "2. 'இப்போதே வாங்கு' அழுத்தவும்",
          descEn: "Enter how many kg you need and your shop address.",
          descTa: "உங்களுக்கு எத்தனை கிலோ வேண்டும் மற்றும் உங்கள் கடை முகவரியை உள்ளிடவும்.",
          color: "border-amber-500/40 text-amber-400 bg-amber-500/10"
        },
        {
          num: "3",
          icon: Truck,
          titleEn: "Direct Delivery",
          titleTa: "3. கடைக்கு விநியோகம்",
          descEn: "Clean, quality-checked fresh spices delivered straight to your shop!",
          descTa: "தர சோதனை செய்யப்பட்ட புதிய பொருட்கள் நேரடியாக உங்கள் கடைக்கு வரும்!",
          color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
        }
      ]
    }
  };

  const guide = guides[role] || guides.buyer;
  const isTa = language === 'ta';

  return (
    <div className="panel-glass p-5 mb-6 border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/40 to-emerald-950/20 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 transition-colors"
        title="Close Guide"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <HelpCircle size={20} className="text-amber-400 animate-pulse" />
        <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider font-heading">
          {isTa ? guide.titleTa : guide.titleEn}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {guide.steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className={`p-3.5 rounded-xl border backdrop-blur-md space-y-2 ${step.color}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-950/80 border border-current flex items-center justify-center font-extrabold text-xs">
                  {step.num}
                </div>
                <Icon size={18} />
                <span className="font-extrabold text-xs uppercase tracking-wide">
                  {isTa ? step.titleTa : step.titleEn}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed pl-9">
                {isTa ? step.descTa : step.descEn}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleHelpGuide;
