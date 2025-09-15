// Animation utilities for better UX
export const animations = {
  // Fade in animation
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Scale in animation
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Bounce animation for buttons
  bounce: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },

  // Recording pulse animation
  recordingPulse: {
    animate: { 
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7]
    },
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  },

  // Loading spinner
  spin: {
    animate: { rotate: 360 },
    transition: { 
      duration: 1, 
      repeat: Infinity, 
      ease: "linear" 
    }
  },

  // Stagger animation for lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },

  // Page transition
  pageTransition: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2, ease: "easeInOut" }
  }
};

// CSS classes for animations
export const animationClasses = {
  fadeIn: "animate-in fade-in duration-300",
  slideInRight: "animate-in slide-in-from-right duration-300",
  slideInLeft: "animate-in slide-in-from-left duration-300",
  scaleIn: "animate-in zoom-in duration-200",
  bounce: "hover:scale-105 active:scale-95 transition-transform",
  recordingPulse: "animate-pulse",
  spin: "animate-spin"
};

// Hook for staggered animations
export const useStaggerAnimation = (items: any[]) => {
  return {
    container: animations.staggerContainer,
    items: items.map((_, index) => ({
      ...animations.staggerItem,
      transition: {
        ...animations.staggerItem.transition,
        delay: index * 0.1
      }
    }))
  };
};
