import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface OnboardingSuccessProps {
  firstName: string;
}

export function OnboardingSuccess({ firstName }: OnboardingSuccessProps) {
  const [showSecond, setShowSecond] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-center relative">
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
          }}
          onAnimationComplete={() => {
            setTimeout(() => {
              setShowSecond(true);
            }, 1500);
          }}
          className="text-5xl font-bold"
        >
          Hey {firstName},
        </motion.h2>

        <div className="h-10 pt-8 relative">
          <AnimatePresence>
            {showSecond && (
              <motion.h2
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut",
                }}
                className="text-sm absolute w-full"
              >
                let&apos;s find you a date.
              </motion.h2>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
