// Animaciones básicas
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Animaciones para móvil
export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const slideDown = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Animaciones de grabación
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const recordingPulse = {
  animate: {
    scale: [1, 1.1, 1],
    boxShadow: [
      "0 0 0 0 rgba(239, 68, 68, 0.7)",
      "0 0 0 10px rgba(239, 68, 68, 0)",
      "0 0 0 0 rgba(239, 68, 68, 0)"
    ]
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Animaciones de lista
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Animaciones de botones
export const buttonHover = {
  whileHover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  whileTap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

// Animaciones de transición de página
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeInOut" }
};

// Animaciones de notificación
export const notificationSlide = {
  initial: { x: 300, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 300, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Animaciones de carga
export const loadingSpinner = {
  animate: {
    rotate: 360
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "linear"
  }
};

// Animaciones de búsqueda
export const searchFocus = {
  focus: {
    scale: 1.02,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    transition: { duration: 0.2 }
  }
};

// Animaciones de swipe para móvil
export const swipeGesture = {
  drag: "x",
  dragConstraints: { left: -100, right: 100 },
  dragElastic: 0.2,
  whileDrag: { scale: 1.05 },
  onDragEnd: (event: any, info: any) => {
    if (info.offset.x > 50) {
      // Swipe right action
      return "swipeRight";
    } else if (info.offset.x < -50) {
      // Swipe left action
      return "swipeLeft";
    }
  }
};