import { motion } from 'framer-motion';

export default function ProgressView() {
  return (
    <div className="px-2 sm:px-4 pb-10 max-w-6xl mx-auto mt-2">
      <motion.div 
        className="bg-[#f0f0f0] rounded-xl p-4 sm:p-8 min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          ease: "easeOut" 
        }}
      >
        <motion.h3 
          className="text-lg sm:text-xl font-medium mb-3 sm:mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            delay: 0.2,
            duration: 0.4
          }}
        >
          Progress Dashboard
        </motion.h3>
        <motion.p 
          className="text-gray-500 text-center max-w-md text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            delay: 0.4,
            duration: 0.4
          }}
        >
          This section will display dynamic progress statistics and charts for your learning journey.
          Coming soon!
        </motion.p>
      </motion.div>
    </div>
  );
} 