import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Play,
  Pause,
  Shuffle
} from 'lucide-react';

export const MONUMENTS_DATA = [
  {
    id: 'taj-mahal',
    number: '01 / 07',
    name: 'Taj Mahal',
    country: 'Agra, India',
    flag: '🇮🇳',
    era: '1632–1653 CE',
    wonderType: 'New 7 Wonders of the World',
    tagline: 'The Jewel of Muslim Art and World Heritage',
    fact: 'Crafted from translucent white Makrana marble that softly shifts colors throughout the day: blush pink at sunrise, milky white at noon, and golden bronze beneath the moon.',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=90',
    fallbackImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=90',
    accentColor: '#f43f5e'
  },
  {
    id: 'great-wall',
    number: '02 / 07',
    name: 'Great Wall of China',
    country: 'Northern China',
    flag: '🇨🇳',
    era: '7th Century BCE – 1644 CE',
    wonderType: 'New 7 Wonders of the World',
    tagline: 'Over 21,196 Kilometers of Human Fortitude',
    fact: 'Ancient builders used a sticky rice mortar mixture to bond the granite bricks, which created an impenetrable calcium-rich seal that has endured wind and weather for centuries.',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=90',
    fallbackImage: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=2000&q=90',
    accentColor: '#10b981'
  },
  {
    id: 'petra',
    number: '03 / 07',
    name: 'Petra',
    country: "Ma'an, Jordan",
    flag: '🇯🇴',
    era: 'c. 312 BCE',
    wonderType: 'New 7 Wonders of the World',
    tagline: 'The Rose-Red City Half as Old as Time',
    fact: 'Masterminded by the Nabataeans, who carved the 40-meter Treasury (Al-Khazneh) directly into sheer red sandstone and engineered gravity-fed terracotta conduits to survive the desert.',
    image: 'https://images.unsplash.com/photo-1605647268776-351beaa13c58?auto=format&fit=crop&w=2000&q=90',
    fallbackImage: 'https://images.unsplash.com/photo-1500120194857-62b493650979?auto=format&fit=crop&w=2000&q=90',
    accentColor: '#f59e0b'
  },
  {
    id: 'colosseum',
    number: '04 / 07',
    name: 'Colosseum',
    country: 'Rome, Italy',
    flag: '🇮🇹',
    era: '72–80 CE',
    wonderType: 'New 7 Wonders of the World',
    tagline: 'Flavian Amphitheater of the Roman Empire',
    fact: 'This colossal elliptical structure held up to 50,000 spectators and possessed complex subterranean elevators and trapdoors (the hypogeum) that could also be flooded to stage mock naval battles.',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2000&q=90',
    fallbackImage: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=90',
    accentColor: '#eab308'
  },
  {
    id: 'machu-picchu',
    number: '05 / 07',
    name: 'Machu Picchu',
    country: 'Cusco Region, Peru',
    flag: '🇵🇪',
    era: 'c. 1450 CE',
    wonderType: 'New 7 Wonders of the World',
    tagline: 'Sacred Sanctuary in the Andean Clouds',
    fact: 'Built 2,430 meters above sea level without mortar, the Inca stones were carved so snugly that not even a knife blade fits between them. When earthquakes strike, the stones dance and settle back securely.',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=2000&q=90',
    fallbackImage: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=2000&q=90',
    accentColor: '#14b8a6'
  },
  {
    id: 'christ-redeemer',
    number: '06 / 07',
    name: 'Christ the Redeemer',
    country: 'Rio de Janeiro, Brazil',
    flag: '🇧🇷',
    era: '1922–1931 CE',
    wonderType: 'New 7 Wonders of the World',
    tagline: 'Art Deco Beacon Overlooking Guanabara Bay',
    fact: 'Perched atop Corcovado mountain at 710 meters, the statue is covered in 6 million triangular soapstone tiles. Workers wrote personal prayers and messages on the tile backs before placing them.',
    image: 'https://images.unsplash.com/photo-1516834611397-8d633eaec5d0?auto=format&fit=crop&w=2000&q=90',
    fallbackImage: 'https://images.unsplash.com/photo-1593995863951-57c27e518295?auto=format&fit=crop&w=2000&q=90',
    accentColor: '#38bdf8'
  },
  {
    id: 'chichen-itza',
    number: '07 / 07',
    name: 'Chichén Itzá',
    country: 'Yucatán, Mexico',
    flag: '🇲🇽',
    era: 'c. 600–1200 CE',
    wonderType: 'New 7 Wonders of the World',
    tagline: 'The Great Maya Pyramid of Kukulcán',
    fact: 'On the spring and autumn equinoxes, the afternoon sun casts seven triangular shadows down the north balustrade, mimicking a giant feathered serpent slithering into the earth.',
    image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=2000&q=90',
    fallbackImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=2000&q=90',
    accentColor: '#818cf8'
  }
];

export default function MonumentsLoadingScreen({ onFinish, isStandaloneModal = false, onClose }) {
  // Start with a RANDOM monument index on every load!
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * MONUMENTS_DATA.length));
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imgSrc, setImgSrc] = useState(null);

  const current = MONUMENTS_DATA[currentIndex];

  // Reset custom image source when monument index changes
  useEffect(() => {
    setImgSrc(current.image);
  }, [currentIndex, current]);

  // Handle fallback if an image fails to load
  const handleImageError = () => {
    if (current.fallbackImage && imgSrc !== current.fallbackImage) {
      setImgSrc(current.fallbackImage);
    }
  };

  // Immediate smooth exit
  const handleComplete = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      if (onFinish) onFinish();
      if (onClose) onClose();
    }, 600);
  };

  // 1-Second Timer for App Initial Loading Screen
  useEffect(() => {
    if (isStandaloneModal) return;

    // Smooth 1.0 second progress bar
    const startTime = Date.now();
    const duration = 1000; // 1 second

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        handleComplete();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isStandaloneModal]);

  // Auto-tour for standalone modal mode (cycles every 4 seconds)
  useEffect(() => {
    if (!isStandaloneModal || !isAutoPlaying) return;

    const cycle = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % MONUMENTS_DATA.length);
    }, 4000);

    return () => clearInterval(cycle);
  }, [isStandaloneModal, isAutoPlaying]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev === 0 ? MONUMENTS_DATA.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev + 1) % MONUMENTS_DATA.length);
  };

  const handleRandom = (e) => {
    if (e) e.stopPropagation();
    setIsAutoPlaying(false);
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * MONUMENTS_DATA.length);
    } while (nextIdx === currentIndex && MONUMENTS_DATA.length > 1);
    setCurrentIndex(nextIdx);
  };

  return (
    <div
      className={`monuments-loader-fullscreen ${isFadingOut ? 'fade-out' : ''}`}
      onClick={!isStandaloneModal ? handleComplete : undefined}
      style={{
        '--monument-accent': current.accentColor
      }}
    >
      {/* 1. Full-Screen Wallpaper Photo Cover */}
      <img
        src={imgSrc || current.image}
        alt={current.name}
        className="monument-fullscreen-wallpaper"
        onError={handleImageError}
        key={current.id}
      />

      {/* 2. Soft Bottom-Left & Top Vignette Gradients for Crystal Legibility */}
      <div className="monument-cinematic-vignette" />

      {/* 3. Top Header Bar (Skip / Close / Mode indicator) */}
      <div className="monument-top-strip" onClick={(e) => e.stopPropagation()}>
        <div className="monument-brand-tag">
          <Compass size={15} className="compass-icon-spin" />
          <span>ASTER INSTITUTE · 7 WORLD MONUMENTS</span>
        </div>

        <div className="monument-top-actions">
          {isStandaloneModal ? (
            <button
              type="button"
              className="monument-btn-close"
              onClick={onClose}
              title="Close World Monuments Showcase (Esc)"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="monument-skip-pill"
              onClick={handleComplete}
              title="Enter Aster Portal immediately"
            >
              <span>Skip</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Bottom-Left Corner Data Presentation */}
      <div className="monument-bottom-left-corner" onClick={(e) => e.stopPropagation()}>
        {/* Flag, Country & Era Pill */}
        <div className="corner-location-pill">
          <span className="corner-flag">{current.flag}</span>
          <span className="corner-country">{current.country}</span>
          <span className="corner-sep">·</span>
          <span className="corner-era">{current.era}</span>
          <span className="corner-sep">·</span>
          <span className="corner-wonder-type">{current.wonderType}</span>
        </div>

        {/* Monument Name (Grand Typography) */}
        <h1 className="corner-monument-name">{current.name}</h1>

        {/* Tagline */}
        <div className="corner-tagline">{current.tagline}</div>

        {/* Architectural / Educational Fact */}
        <p className="corner-fact-text">"{current.fact}"</p>

        {/* 1-Second Smooth Progress Line (App Startup Mode) */}
        {!isStandaloneModal && (
          <div className="corner-progress-wrap">
            <div className="corner-progress-track">
              <div
                className="corner-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="corner-progress-status">
              <span>{progress >= 100 ? 'Entering Aster Portal...' : `Loading Experience · ${progress}%`}</span>
              <span className="corner-click-hint">Click anywhere to enter</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Standalone Modal Interactive Controls (Bottom-Right) */}
      {isStandaloneModal && (
        <div className="monument-modal-controls" onClick={(e) => e.stopPropagation()}>
          <div className="modal-controls-row">
            <button
              type="button"
              className="modal-ctrl-btn"
              onClick={handlePrev}
              title="Previous Monument"
            >
              <ArrowLeft size={16} />
            </button>

            <button
              type="button"
              className="modal-ctrl-btn"
              onClick={handleRandom}
              title="Random Wonder 🎲"
            >
              <Shuffle size={15} />
            </button>

            <button
              type="button"
              className="modal-ctrl-btn"
              onClick={() => setIsAutoPlaying(prev => !prev)}
              title={isAutoPlaying ? "Pause Auto Flow" : "Play Auto Flow"}
            >
              {isAutoPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>

            <button
              type="button"
              className="modal-ctrl-btn"
              onClick={handleNext}
              title="Next Monument"
            >
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="monument-dots-row">
            {MONUMENTS_DATA.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`monument-thumb-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(idx);
                }}
                title={`${item.flag} ${item.name}`}
              >
                <span className="dot-label">{idx + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}