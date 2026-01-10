"use client"

import { useEffect, useState } from "react"
import { motion, stagger, useAnimate, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface TextGenerateEffectProps {
  words: string
  className?: string
  filter?: boolean
  duration?: number
  staggerDelay?: number
}

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.1,
}: TextGenerateEffectProps) {
  const [scope, animate] = useAnimate()
  const isInView = useInView(scope, { once: true })
  const wordsArray = words.split(" ")

  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: duration,
          delay: stagger(staggerDelay),
        }
      )
    }
  }, [isInView, animate, duration, filter, staggerDelay])

  return (
    <motion.div ref={scope} className={cn("font-bold", className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          className="opacity-0"
          style={{
            filter: filter ? "blur(10px)" : "none",
          }}
        >
          {word}{" "}
        </motion.span>
      ))}
    </motion.div>
  )
}
