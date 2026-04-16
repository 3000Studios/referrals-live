import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-24">
      <motion.div
        className="h-12 w-12 rounded-full border-2 border-neon/30 border-t-neon"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        aria-label="Loading"
      />
    </div>
  );
}
