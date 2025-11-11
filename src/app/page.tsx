
"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image"; 

// Animation variants 
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
-0
export default function LandingPage() {
  const router = useRouter();

  return (
  
         <main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">
      

      <motion.div
        className="flex flex-col items-center justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="sr-only">Tap Tap Trivia</h1>
          
          <Image
            src="/trivia.png" //Main logo from main page, centered and saved in /public
            alt="Tap Tap Trivia Logo"
            width={400}  
            height={150} 
            priority 
            className="drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]"
          />
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-lg text-gray-300 mb-10 text-center max-w-md font-mono"
        >
          Challenge your friends and test your knowledge in real time!
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="bg-pink-600 text-white font-semibold font-mono px-8 py-3 rounded-lg shadow-lg hover:bg-pink-500 shadow-[0_0_12px_rgba(219,39,119,0.6)]"
            onClick={() => router.push("/rooms")}
          >
            Start Game
          </motion.button>
 
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="bg-cyan-600 text-white font-semibold font-mono px-8 py-3 rounded-lg shadow-lg hover:bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            onClick={() => router.push("/join")}
          >
            Join Game
          </motion.button>
        </motion.div>
      </motion.div>

      <footer className="absolute bottom-6 text-gray-400 text-sm font-mono"> 
        © {new Date().getFullYear()} Tap Tap Trivia 
      </footer>
    </main>
  );
}