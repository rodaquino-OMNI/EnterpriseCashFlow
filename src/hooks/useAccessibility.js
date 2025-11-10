/**
 * Accessibility Hooks - Design System Foundation
 * Custom hooks for focus management, keyboard navigation, and accessibility utilities
 * @version 1.0.0
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useFocusManagement Hook
 * 
 * Provides utilities for managing focus within components and modals.
 * Includes focus trapping, restoration, and programmatic focus control.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.trapFocus - Whether to trap focus within container
 * @param {boolean} options.restoreOnUnmount - Whether to restore focus on unmount
 * @param {string} options.initialFocus - Selector for initial focus element
 * @returns {Object} Focus management utilities
 */
export const useFocusManagement = ({
  trapFocus = false,
  restoreOnUnmount = true,
  initialFocus = null,
} = {}) => {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);
  const [isActive, setIsActive] = useState(false);

  // Store the previously focused element
  useEffect(() => {
    if (isActive) {
      previousActiveElement.current = document.activeElement;
    }
  }, [isActive]);

  // Focus the initial element when activated
  useEffect(() => {
    if (isActive && containerRef.current) {
      const focusElement = initialFocus 
        ? containerRef.current.querySelector(initialFocus)
        : getFirstFocusableElement(containerRef.current);
      
      if (focusElement) {
        focusElement.focus();
      }
    }
  }, [isActive, initialFocus]);

  // Handle focus trapping
  useEffect(() => {
    if (!trapFocus || !isActive || !containerRef.current) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements(containerRef.current);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [trapFocus, isActive]);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      if (restoreOnUnmount && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreOnUnmount]);

  const activate = useCallback(() => setIsActive(true), []);
  const deactivate = useCallback(() => setIsActive(false), []);

  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      const firstElement = getFirstFocusableElement(containerRef.current);
      firstElement?.focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current);
      const lastElement = focusableElements[focusableElements.length - 1];
      lastElement?.focus();
    }
  }, []);

  return {
    containerRef,
    isActive,
    activate,
    deactivate,
    focusFirst,
    focusLast,
  };
};

/**
 * useKeyboardNavigation Hook
 * 
 * Provides keyboard navigation utilities for lists, menus, and complex components.
 * Supports arrow key navigation, home/end keys, and custom key handlers.
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items to navigate
 * @param {boolean} options.loop - Whether navigation should loop
 * @param {string} options.orientation - Navigation orientation ('horizontal' | 'vertical' | 'both')
 * @param {Object} options.customKeys - Custom key handlers
 * @returns {Object} Navigation utilities
 */
export const useKeyboardNavigation = ({
  items = [],
  loop = true,
  orientation = 'vertical',
  customKeys = {},
} = {}) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  const moveToIndex = useCallback((index) => {
    if (index < 0 || index >= items.length) return;
    setActiveIndex(index);
    
    // Focus the element if it exists
    if (containerRef.current) {
      const element = containerRef.current.children[index];
      if (element && typeof element.focus === 'function') {
        element.focus();
      }
    }
  }, [items.length]);

  const moveNext = useCallback(() => {
    const nextIndex = activeIndex + 1;
    if (nextIndex >= items.length) {
      if (loop) {
        moveToIndex(0);
      }
    } else {
      moveToIndex(nextIndex);
    }
  }, [activeIndex, items.length, loop, moveToIndex]);

  const movePrevious = useCallback(() => {
    const prevIndex = activeIndex - 1;
    if (prevIndex < 0) {
      if (loop) {
        moveToIndex(items.length - 1);
      }
    } else {
      moveToIndex(prevIndex);
    }
  }, [activeIndex, items.length, loop, moveToIndex]);

  const moveToFirst = useCallback(() => {
    moveToIndex(0);
  }, [moveToIndex]);

  const moveToLast = useCallback(() => {
    moveToIndex(items.length - 1);
  }, [items.length, moveToIndex]);

  const handleKeyDown = useCallback((e) => {
    const { key } = e;
    
    // Handle custom keys first
    if (customKeys[key]) {
      customKeys[key](e, { activeIndex, moveToIndex, moveNext, movePrevious });
      return;
    }

    // Handle standard navigation keys
    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          moveNext();
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          movePrevious();
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          moveNext();
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          movePrevious();
        }
        break;
      case 'Home':
        e.preventDefault();
        moveToFirst();
        break;
      case 'End':
        e.preventDefault();
        moveToLast();
        break;
      default:
        break;
    }
  }, [orientation, customKeys, activeIndex, moveNext, movePrevious, moveToFirst, moveToLast, moveToIndex]);

  return {
    containerRef,
    activeIndex,
    setActiveIndex,
    moveToIndex,
    moveNext,
    movePrevious,
    moveToFirst,
    moveToLast,
    handleKeyDown,
  };
};

/**
 * useAnnouncement Hook
 * 
 * Provides utilities for making announcements to screen readers.
 * Supports different politeness levels and automatic cleanup.
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.politeness - Announcement politeness ('polite' | 'assertive')
 * @param {number} options.timeout - Auto-clear timeout in milliseconds
 * @returns {Object} Announcement utilities
 */
export const useAnnouncement = ({
  politeness = 'polite',
  timeout = 5000,
} = {}) => {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef(null);

  const announce = useCallback((text) => {
    setMessage(text);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout to clear message
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setMessage('');
      }, timeout);
    }
  }, [timeout]);

  const clear = useCallback(() => {
    setMessage('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    message,
    announce,
    clear,
    politeness,
  };
};

/**
 * useReducedMotion Hook
 * 
 * Detects user's motion preferences and provides utilities for respecting them.
 * 
 * @returns {boolean} Whether user prefers reduced motion
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * useAriaLive Hook
 * 
 * Creates and manages an aria-live region for dynamic content announcements.
 * 
 * @param {string} politeness - Live region politeness ('polite' | 'assertive' | 'off')
 * @returns {Object} Live region utilities
 */
export const useAriaLive = (politeness = 'polite') => {
  const liveRegionRef = useRef(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', politeness);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, [politeness]);

  const announce = useCallback((message) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  }, []);

  return { announce };
};

/**
 * Utility Functions
 */

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
export const getFocusableElements = (container) => {
  if (!container) return [];
  
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter(element => {
      return element.offsetWidth > 0 && 
             element.offsetHeight > 0 && 
             !element.hidden;
    });
};

/**
 * Get the first focusable element within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement|null} First focusable element or null
 */
export const getFirstFocusableElement = (container) => {
  const focusableElements = getFocusableElements(container);
  return focusableElements[0] || null;
};

/**
 * Get the last focusable element within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement|null} Last focusable element or null
 */
export const getLastFocusableElement = (container) => {
  const focusableElements = getFocusableElements(container);
  return focusableElements[focusableElements.length - 1] || null;
};

/**
 * Check if an element is currently visible and focusable
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether element is focusable
 */
export const isFocusable = (element) => {
  if (!element) return false;
  
  return element.offsetWidth > 0 && 
         element.offsetHeight > 0 && 
         !element.hidden && 
         !element.disabled &&
         element.tabIndex !== -1;
};