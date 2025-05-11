"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TodayClassesWidget from "@/components/widgets/TodayClassesWidget";
import Link from "next/link";

// Animation variants extracted outside the component (similar approach to YourClassesView & CalendarView)
const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 }
  }
} as const;

// Container stagger (lighter – 0.1s like YourClassesView)
const containerVariantsStatic = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

// Main card – simple slide + fade
const mainCardVariantsStatic = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
} as const;

// Small cards – slightly faster animation
const smallCardVariantsStatic = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
} as const;

export default function Home() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  
  // Preload background image
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const bgImage = new Image();
    bgImage.src = "https://storage.googleapis.com/test2324234242/ChatGPT_Image_Apr_21_2025_11_55_35_PM_1.png";
    bgImage.onload = () => {
      setImageLoaded(true);
    };
    
    // Set a fallback timer in case image load fails
    const timer = setTimeout(() => {
      if (!imageLoaded) setImageLoaded(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Set page ready after a short delay once image is loaded
  useEffect(() => {
    if (imageLoaded) {
      const timer = setTimeout(() => {
        setPageReady(true);
      }, 100); // Small delay to ensure smooth transition
      
      return () => clearTimeout(timer);
    }
  }, [imageLoaded]);

  return (
    <>
      {/* Image preloader overlay */}
      <AnimatePresence>
        {!pageReady && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 bg-[#F6F8FB] z-50 flex items-center justify-center"
          >
            <div className="w-16 h-16 border-t-4 border-b-4 border-[#10B981] rounded-full animate-spin"></div>
          </motion.div>
        )}
      </AnimatePresence>
    
      <motion.div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `url('https://storage.googleapis.com/test2324234242/ChatGPT_Image_Apr_21_2025_11_55_35_PM_1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden'
        }}
        initial="hidden"
        animate={pageReady ? "visible" : "hidden"}
        variants={fadeInVariants}
      >
        {/* White overlay to ensure readability */}
        <div className="absolute inset-0 bg-white/30 z-0"></div>
        
        <style jsx global>{`
          :root {
            --bg-gradient-from: #F6F8FB;
            --bg-gradient-to: #E4F1FF;
            --surface-glass: rgba(255,255,255,0.36);
            --surface-inner: rgba(255,255,255,0.28);
            --surface-stroke: rgba(255,255,255,0.35);
            --hairline: rgba(60,60,67,0.23);
            --accent-color: #10B981;
            --accent-success: #30D158;
            --text-primary: #1C1C1E;
            --text-secondary: rgba(60,60,67,0.6);
          }
          
          .card {
            backdrop-filter: blur(24px) saturate(180%);
            background: var(--surface-glass);
            border: 1px solid var(--surface-stroke);
            border-radius: 24px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
            position: relative;
          }
          
          .card::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 800px rgba(255,255,255,0.20);
            pointer-events: none;
          }
        `}</style>
        
        <motion.div 
          className="w-full max-w-full overflow-x-hidden h-[calc(100vh-2rem)] px-4 relative z-10 pt-8"
          variants={containerVariantsStatic}
          initial="hidden"
          animate={pageReady ? "visible" : "hidden"}
        >
          {/* Main "Keep Watching" Card */}
          <motion.div 
            className="mb-4 h-[45%] mx-2 mt-8"
            variants={mainCardVariantsStatic}
          >
            <div 
              className="card relative p-6 h-full w-full overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => console.log("Keep watching clicked")}
            >
              <div className="absolute bottom-0 left-0 p-6 z-20 text-[var(--text-primary)]">
                <h2 className="text-2xl font-medium mb-2">Keep Watching</h2>
                <p className="text-lg text-[var(--text-secondary)]">Continue where you left off</p>
              </div>
            </div>
          </motion.div>

          {/* Three cards side by side */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[45%] mx-2"
            variants={containerVariantsStatic}
          >
            {/* Today's Classes Card */}
            <motion.div 
              variants={smallCardVariantsStatic}
              className="h-full"
            >
              <TodayClassesWidget />
            </motion.div>

            {/* Subjects Card */}
            <motion.div 
              className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
              variants={smallCardVariantsStatic}
            >
              <Link href="/subjects" className="block h-full">
                <div className="relative h-full">
                  <div className="absolute bottom-0 left-0 p-4 z-20 text-[var(--text-primary)]">
                    <h2 className="text-xl font-medium mb-1">Subjects</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Explore subjects and materials</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Progress Card */}
            <motion.div 
              className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
              variants={smallCardVariantsStatic}
            >
              <Link href="/progress" className="block h-full">
                <div className="relative h-full">
                  <div className="absolute bottom-0 left-0 p-4 z-20 text-[var(--text-primary)]">
                    <h2 className="text-xl font-medium mb-1">Progress</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Track your learning progress</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}
