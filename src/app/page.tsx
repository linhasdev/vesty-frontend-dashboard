"use client";

import { motion } from "framer-motion";
import TodayClassesWidget from "@/components/widgets/TodayClassesWidget";
import Link from "next/link";

export default function Home() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const mainCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const smallCardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="w-full max-w-full overflow-x-hidden h-[calc(100vh-3rem)] px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main "Keep Watching" Card */}
      <motion.div 
        className="mb-6 h-[45%] mx-2 mt-4"
        variants={mainCardVariants}
      >
        <div 
          className="relative bg-gradient-to-br from-accent-green to-accent-green-dark rounded-card p-6 h-full w-full overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => console.log("Keep watching clicked")}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25 z-10"></div>
          <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
            <h2 className="text-2xl font-medium mb-2">Keep Watching</h2>
            <p className="text-lg">Continue where you left off</p>
          </div>
        </div>
      </motion.div>

      {/* Three cards side by side */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[35%] mx-2"
        variants={containerVariants}
      >
        {/* Today's Classes Card */}
        <motion.div 
          variants={smallCardVariants}
          className="h-full"
        >
          <TodayClassesWidget />
        </motion.div>

        {/* Subjects Card */}
        <motion.div 
          className="bg-gradient-to-br from-accent-green to-accent-green-dark rounded-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
          variants={smallCardVariants}
        >
          <Link href="/subjects" className="block h-full">
            <div className="relative h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25 z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20 text-white">
                <h2 className="text-xl font-medium mb-1">Subjects</h2>
                <p className="text-sm">Explore subjects and materials</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Progress Card */}
        <motion.div 
          className="bg-gradient-to-br from-accent-green-light to-accent-green rounded-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
          variants={smallCardVariants}
        >
          <Link href="/progress" className="block h-full">
            <div className="relative h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25 z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20 text-white">
                <h2 className="text-xl font-medium mb-1">Progress</h2>
                <p className="text-sm">Track your learning progress</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
