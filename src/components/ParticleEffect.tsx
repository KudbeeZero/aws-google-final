import React from "react";
import { motion } from "motion/react";

export const ParticleEffect = ({ x, y }: { x: number; y: number }) => {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x, y, opacity: 1, scale: 1 }}
          animate={{
            x: x + (Math.random() - 0.5) * 60,
            y: y + (Math.random() - 0.5) * 60,
            opacity: 0,
            scale: 0
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed w-2 h-2 bg-[#FF9900] rounded-full z-[100] pointer-events-none"
        />
      ))}
    </>
  );
};
