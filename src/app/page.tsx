"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";


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



const letters = "TRIVIA".split("");

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

          <div className="flex flex-col items-center mt-10">
            {/* TRIVIA */}
            <div
              className="
                flex gap-2
                text-8xl sm:text-9xl tracking-[0.05em]
                font-bitcount
                text-cyan-300
                drop-shadow-[0_0_25px_rgba(34,211,238,0.9)]
              "
            >
              {letters.map((ch, i) => (
                <span
                  key={i}
                  className="inline-block animate-[wave_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.1}s` }} // wave offset per letter
                >
                  {ch}
                </span>
              ))}
            </div>

            {/* night */}
            <span
              className={`
                
                mt-3 text-4xl sm:text-5xl italic
                font-greatvibes
                text-pink-500
                drop-shadow-[0_0_20px_rgba(236,72,153,0.95)]
                animate-[neonFlicker_1.8s_ease-in-out_infinite]
              `}
            >
              Night
            </span>
          </div>
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
            onClick={() => router.push("/login")}
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
