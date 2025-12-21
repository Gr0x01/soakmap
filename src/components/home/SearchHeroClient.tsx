'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Navigation, ChevronDown, Check, Flame, Waves, Droplet, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchHeroClientProps {
  stats: {
    springs: number;
    states: number;
    hot: number;
    warm: number;
    cold: number;
  };
  states: Array<{ code: string; name: string; count: number }>;
}

export function SearchHeroClient({ stats, states }: SearchHeroClientProps) {
  const router = useRouter();
  const [selectedState, setSelectedState] = useState<{ code: string; name: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleStateSelect = (state: { code: string; name: string }) => {
    setSelectedState(state);
    setIsOpen(false);
    router.push(`/states/${state.code.toLowerCase()}`);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/near?lat=${latitude}&lng=${longitude}`);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please select a state instead.');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <>
      {/* ================================================================
          HERO SECTION - Bold typography, dark forest background
          ================================================================ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-forest">
        {/* Layered background effects */}
        <div className="absolute inset-0">
          {/* Gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-bark via-forest to-forest" />

          {/* Topographic contour pattern - dense organic swirls */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.06]"
            viewBox="0 0 1200 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke="currentColor" className="text-cream" fill="none" strokeWidth="1">
              {/* Large swirl cluster - top left */}
              <path d="M150,120 Q200,80 260,100 Q320,120 340,180 Q360,240 320,290 Q280,340 210,340 Q140,340 100,290 Q60,240 80,180 Q100,120 150,120" />
              <path d="M160,140 Q200,110 245,125 Q290,140 305,185 Q320,230 290,265 Q260,300 210,300 Q160,300 130,265 Q100,230 115,185 Q130,140 160,140" />
              <path d="M170,160 Q200,140 230,150 Q260,160 270,190 Q280,220 260,245 Q240,270 210,270 Q180,270 160,245 Q140,220 150,190 Q160,160 170,160" />
              <path d="M185,180 Q205,165 225,175 Q245,185 250,205 Q255,225 240,240 Q225,255 205,255 Q185,255 170,240 Q155,225 160,205 Q165,185 185,180" />

              {/* Elongated formation - top center */}
              <path d="M400,50 Q480,30 560,60 Q640,90 680,160 Q720,230 680,300 Q640,370 560,390 Q480,410 400,380 Q320,350 300,280 Q280,210 320,140 Q360,70 400,50" />
              <path d="M420,80 Q480,65 540,85 Q600,105 630,160 Q660,215 630,270 Q600,325 540,340 Q480,355 420,330 Q360,305 345,250 Q330,195 360,145 Q390,95 420,80" />
              <path d="M440,110 Q485,100 530,115 Q575,130 595,170 Q615,210 595,250 Q575,290 530,300 Q485,310 440,290 Q395,270 385,230 Q375,190 400,155 Q425,120 440,110" />
              <path d="M460,140 Q490,132 520,145 Q550,158 565,185 Q580,212 565,240 Q550,268 520,275 Q490,282 460,265 Q430,248 425,220 Q420,192 440,170 Q460,148 460,140" />
              <path d="M475,165 Q495,160 515,170 Q535,180 545,200 Q555,220 545,240 Q535,260 515,265 Q495,270 475,260 Q455,250 450,230 Q445,210 460,190 Q475,170 475,165" />

              {/* Small tight swirl - top right */}
              <path d="M900,100 Q950,70 1000,90 Q1050,110 1070,160 Q1090,210 1060,260 Q1030,310 970,320 Q910,330 870,290 Q830,250 850,190 Q870,130 900,100" />
              <path d="M910,130 Q945,105 985,120 Q1025,135 1040,170 Q1055,205 1035,245 Q1015,285 970,290 Q925,295 895,265 Q865,235 880,195 Q895,155 910,130" />
              <path d="M925,155 Q950,140 980,150 Q1010,160 1020,185 Q1030,210 1015,235 Q1000,260 970,262 Q940,264 920,245 Q900,226 910,200 Q920,174 925,155" />
              <path d="M940,178 Q958,168 978,175 Q998,182 1005,200 Q1012,218 1000,235 Q988,252 968,252 Q948,252 935,238 Q922,224 930,205 Q938,186 940,178" />

              {/* Large organic blob - center left */}
              <path d="M80,400 Q140,350 220,360 Q300,370 360,430 Q420,490 400,570 Q380,650 300,690 Q220,730 140,700 Q60,670 40,590 Q20,510 50,450 Q80,390 80,400" />
              <path d="M110,420 Q155,385 215,395 Q275,405 325,450 Q375,495 360,560 Q345,625 285,658 Q225,691 165,668 Q105,645 88,580 Q71,515 95,465 Q119,415 110,420" />
              <path d="M135,445 Q170,420 215,428 Q260,436 298,472 Q336,508 325,558 Q314,608 270,632 Q226,656 180,638 Q134,620 122,572 Q110,524 128,485 Q146,446 135,445" />
              <path d="M160,470 Q185,452 220,458 Q255,464 282,492 Q309,520 300,558 Q291,596 258,615 Q225,634 190,620 Q155,606 145,568 Q135,530 152,500 Q169,470 160,470" />
              <path d="M182,495 Q202,482 228,486 Q254,490 275,512 Q296,534 290,562 Q284,590 258,604 Q232,618 206,606 Q180,594 172,566 Q164,538 178,515 Q192,492 182,495" />

              {/* Spiral formation - center */}
              <path d="M550,380 Q620,340 700,370 Q780,400 820,480 Q860,560 820,640 Q780,720 690,750 Q600,780 520,740 Q440,700 420,610 Q400,520 450,450 Q500,380 550,380" />
              <path d="M565,415 Q620,385 680,408 Q740,431 772,492 Q804,553 775,618 Q746,683 678,708 Q610,733 550,702 Q490,671 472,605 Q454,539 492,482 Q530,425 565,415" />
              <path d="M585,448 Q625,425 670,445 Q715,465 740,512 Q765,559 745,610 Q725,661 672,680 Q619,699 575,675 Q531,651 518,600 Q505,549 535,505 Q565,461 585,448" />
              <path d="M605,480 Q635,462 668,478 Q701,494 720,532 Q739,570 722,612 Q705,654 665,668 Q625,682 592,662 Q559,642 548,600 Q537,558 562,522 Q587,486 605,480" />
              <path d="M622,510 Q645,498 670,510 Q695,522 708,552 Q721,582 708,615 Q695,648 668,658 Q641,668 615,652 Q589,636 582,605 Q575,574 595,548 Q615,522 622,510" />
              <path d="M638,538 Q655,530 674,540 Q693,550 702,572 Q711,594 700,618 Q689,642 668,648 Q647,654 628,642 Q609,630 605,608 Q601,586 618,565 Q635,544 638,538" />

              {/* Small cluster - center right */}
              <path d="M950,450 Q1000,420 1050,450 Q1100,480 1110,540 Q1120,600 1080,650 Q1040,700 980,700 Q920,700 880,650 Q840,600 860,540 Q880,480 950,450" />
              <path d="M962,480 Q1000,458 1038,480 Q1076,502 1085,548 Q1094,594 1062,632 Q1030,670 982,670 Q934,670 902,632 Q870,594 882,548 Q894,502 962,480" />
              <path d="M975,508 Q1002,492 1030,508 Q1058,524 1065,558 Q1072,592 1048,620 Q1024,648 988,648 Q952,648 928,620 Q904,592 915,558 Q926,524 975,508" />
              <path d="M988,535 Q1005,525 1025,535 Q1045,545 1050,570 Q1055,595 1038,615 Q1021,635 998,635 Q975,635 958,615 Q941,595 950,570 Q959,545 988,535" />

              {/* Bottom left blob */}
              <path d="M150,720 Q220,680 300,710 Q380,740 410,820 Q440,900 390,970 Q340,1040 250,1050 Q160,1060 100,1000 Q40,940 60,860 Q80,780 150,720" />
              <path d="M175,755 Q225,725 285,748 Q345,771 370,832 Q395,893 358,948 Q321,1003 252,1010 Q183,1017 138,968 Q93,919 110,860 Q127,801 175,755" />
              <path d="M200,788 Q235,768 280,785 Q325,802 345,850 Q365,898 338,940 Q311,982 258,988 Q205,994 170,955 Q135,916 150,868 Q165,820 200,788" />
              <path d="M225,820 Q252,805 285,818 Q318,831 332,868 Q346,905 325,938 Q304,971 265,975 Q226,979 200,948 Q174,917 188,878 Q202,839 225,820" />

              {/* Bottom center formation */}
              <path d="M500,750 Q580,710 670,740 Q760,770 810,850 Q860,930 820,1010 Q780,1090 680,1120 Q580,1150 490,1100 Q400,1050 380,960 Q360,870 420,800 Q480,730 500,750" />
              <path d="M530,790 Q590,760 660,782 Q730,804 770,868 Q810,932 780,998 Q750,1064 672,1088 Q594,1112 525,1072 Q456,1032 440,958 Q424,884 478,828 Q532,772 530,790" />
              <path d="M558,825 Q605,802 660,820 Q715,838 748,890 Q781,942 758,995 Q735,1048 672,1068 Q609,1088 558,1055 Q507,1022 495,962 Q483,902 525,858 Q567,814 558,825" />
              <path d="M585,860 Q622,842 665,856 Q708,870 735,912 Q762,954 742,998 Q722,1042 672,1058 Q622,1074 582,1048 Q542,1022 532,972 Q522,922 560,885 Q598,848 585,860" />

              {/* Bottom right swirl */}
              <path d="M900,700 Q970,660 1050,690 Q1130,720 1160,800 Q1190,880 1140,960 Q1090,1040 1000,1060 Q910,1080 840,1020 Q770,960 800,870 Q830,780 900,700" />
              <path d="M920,745 Q975,715 1035,738 Q1095,761 1120,825 Q1145,889 1108,955 Q1071,1021 1000,1038 Q929,1055 875,1008 Q821,961 848,888 Q875,815 920,745" />
              <path d="M945,785 Q985,762 1030,780 Q1075,798 1095,850 Q1115,902 1088,955 Q1061,1008 1005,1022 Q949,1036 908,998 Q867,960 888,905 Q909,850 945,785" />
              <path d="M968,822 Q998,805 1032,820 Q1066,835 1082,875 Q1098,915 1078,958 Q1058,1001 1012,1012 Q966,1023 935,992 Q904,961 920,915 Q936,869 968,822" />
              <path d="M990,858 Q1012,845 1038,858 Q1064,871 1075,902 Q1086,933 1070,965 Q1054,997 1020,1005 Q986,1013 962,988 Q938,963 952,928 Q966,893 990,858" />

              {/* Extra organic lines connecting formations */}
              <path d="M260,340 Q300,380 350,360 Q400,340 450,380" strokeWidth="0.5" />
              <path d="M720,300 Q780,340 850,320 Q920,300 950,350" strokeWidth="0.5" />
              <path d="M400,570 Q450,600 500,580 Q550,560 580,600" strokeWidth="0.5" />
              <path d="M820,640 Q870,680 920,660 Q970,640 1000,680" strokeWidth="0.5" />
              <path d="M300,690 Q360,720 420,700 Q480,680 520,720" strokeWidth="0.5" />
            </g>
          </svg>

          {/* Organic color blobs */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{ background: 'linear-gradient(135deg, var(--color-terracotta), var(--color-sand))' }}
          />
          <div
            className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full blur-[140px] opacity-15"
            style={{ background: 'linear-gradient(135deg, var(--color-river), var(--color-moss))' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 container-brutal py-16 md:py-24">
          {/* Eyebrow stat */}
          <p
            className="font-display text-moss text-sm md:text-base tracking-widest uppercase mb-6 md:mb-8"
            style={{ animationDelay: '0.1s' }}
          >
            {stats.springs.toLocaleString()} springs · {stats.states} states
          </p>

          {/* Main headline - MASSIVE typography */}
          <h1 className="mb-8 md:mb-12">
            <span className="block font-display text-[clamp(3.5rem,12vw,9rem)] font-extrabold leading-[0.9] tracking-tight text-cream">
              Find your
            </span>
            <span className="block font-display text-[clamp(3.5rem,12vw,9rem)] font-extrabold leading-[0.9] tracking-tight text-terracotta">
              perfect soak
            </span>
          </h1>

          {/* Subheadline */}
          <p className="font-body text-cream/60 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 md:mb-16">
            From steaming hot springs for winter warmth to refreshing swimming holes
            for summer escapes. Discover natural waters across America.
          </p>

          {/* Action row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-20 md:mb-28">
            {/* Near me button - Primary CTA */}
            <button
              type="button"
              onClick={handleNearMe}
              disabled={isLocating}
              className={cn(
                'group flex items-center justify-center gap-3 px-8 py-4',
                'bg-terracotta hover:bg-terracotta/90 text-cream',
                'font-display font-semibold text-base',
                'rounded-full transition-all duration-300',
                'hover:shadow-lg hover:shadow-terracotta/25',
                'disabled:opacity-70 disabled:cursor-not-allowed'
              )}
            >
              <Navigation className={cn('w-5 h-5', isLocating && 'animate-pulse')} />
              {isLocating ? 'Finding location...' : 'Find springs near me'}
            </button>

            {/* State dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  'flex items-center justify-between gap-3 w-full sm:w-64 px-6 py-4',
                  'bg-cream/10 hover:bg-cream/15 backdrop-blur-sm',
                  'border border-cream/20 hover:border-cream/30',
                  'font-display font-medium text-cream text-base',
                  'rounded-full transition-all duration-300',
                  isOpen && 'border-cream/40 bg-cream/15'
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cream/50" />
                  <span className={selectedState ? 'text-cream' : 'text-cream/60'}>
                    {selectedState ? selectedState.name : 'Browse by state'}
                  </span>
                </span>
                <ChevronDown className={cn(
                  'w-4 h-4 text-cream/50 transition-transform duration-300',
                  isOpen && 'rotate-180'
                )} />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-cream rounded-2xl shadow-lifted border border-forest/10 max-h-72 overflow-y-auto z-50"
                  role="listbox"
                >
                  {states.map((state) => (
                    <button
                      key={state.code}
                      type="button"
                      onClick={() => handleStateSelect(state)}
                      className={cn(
                        'w-full px-5 py-3 text-left font-display font-medium flex items-center justify-between',
                        'hover:bg-forest/5 transition-colors',
                        'border-b border-forest/5 last:border-b-0',
                        selectedState?.code === state.code && 'bg-forest text-cream hover:bg-forest'
                      )}
                      role="option"
                      aria-selected={selectedState?.code === state.code}
                    >
                      <span className={selectedState?.code === state.code ? 'text-cream' : 'text-forest'}>
                        {state.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm',
                          selectedState?.code === state.code ? 'text-cream/70' : 'text-bark/40'
                        )}>
                          {state.count}
                        </span>
                        {selectedState?.code === state.code && <Check className="w-4 h-4" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Temperature type cards - The "vibe" selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Hot Springs */}
            <Link
              href="/springs?spring_type=hot"
              className="group relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-terracotta/20 to-terracotta/5 border border-terracotta/20 hover:border-terracotta/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-terracotta/30 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-terracotta" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream group-hover:text-terracotta transition-colors">
                      Hot Springs
                    </h3>
                    <p className="text-cream/50 text-sm font-body">{stats.hot.toLocaleString()} locations</p>
                  </div>
                </div>
                <p className="text-cream/60 font-body text-sm leading-relaxed mb-4">
                  100°F+ mineral pools. Winter soaking, therapeutic relaxation.
                </p>
                <span className="inline-flex items-center gap-2 text-terracotta font-display font-semibold text-sm">
                  Explore
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            {/* Warm Springs */}
            <Link
              href="/springs?spring_type=warm"
              className="group relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-moss/20 to-moss/5 border border-moss/20 hover:border-moss/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-moss/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-moss/30 flex items-center justify-center">
                    <Waves className="w-6 h-6 text-moss" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream group-hover:text-moss transition-colors">
                      Warm Springs
                    </h3>
                    <p className="text-cream/50 text-sm font-body">{stats.warm.toLocaleString()} locations</p>
                  </div>
                </div>
                <p className="text-cream/60 font-body text-sm leading-relaxed mb-4">
                  70-99°F gentle waters. Year-round comfort, perfect balance.
                </p>
                <span className="inline-flex items-center gap-2 text-moss font-display font-semibold text-sm">
                  Explore
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            {/* Swimming Holes */}
            <Link
              href="/springs?spring_type=cold"
              className="group relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-river/20 to-river/5 border border-river/20 hover:border-river/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-river/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-river/30 flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-river" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream group-hover:text-river transition-colors">
                      Swimming Holes
                    </h3>
                    <p className="text-cream/50 text-sm font-body">{stats.cold.toLocaleString()} locations</p>
                  </div>
                </div>
                <p className="text-cream/60 font-body text-sm leading-relaxed mb-4">
                  Under 70°F crystal waters. Summer escapes, cliff jumps, rope swings.
                </p>
                <span className="inline-flex items-center gap-2 text-river font-display font-semibold text-sm">
                  Explore
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
