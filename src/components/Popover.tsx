import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

const PopoverContext = createContext<{ close: () => void } | null>(null);

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  constrainToViewport?: boolean;
}

export function Popover({ 
  trigger, 
  children, 
  className = '',
  position = 'bottom-right',
  constrainToViewport = true
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleClose = () => setIsOpen(false);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Adjust position based on viewport constraints
  useEffect(() => {
    if (isOpen && constrainToViewport && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newPosition = position;
      
      // Check if popover goes off the right edge
      if (rect.right > viewportWidth - 20) {
        if (position.includes('right')) {
          newPosition = position.replace('right', 'left') as typeof position;
        }
      }
      
      // Check if popover goes off the left edge
      if (rect.left < 20) {
        if (position.includes('left')) {
          newPosition = position.replace('left', 'right') as typeof position;
        }
      }
      
      // Check if popover goes off the bottom edge
      if (rect.bottom > viewportHeight - 20) {
        if (position.includes('bottom')) {
          newPosition = position.replace('bottom', 'top') as typeof position;
        }
      }
      
      // Check if popover goes off the top edge
      if (rect.top < 20) {
        if (position.includes('top')) {
          newPosition = position.replace('top', 'bottom') as typeof position;
        }
      }
      
      setAdjustedPosition(newPosition);
    } else {
      setAdjustedPosition(position);
    }
  }, [isOpen, position, constrainToViewport]);

  // Position classes based on adjusted position
  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-2',
    'bottom-left': 'top-full left-0 mt-2',
    'top-right': 'bottom-full right-0 mb-2',
    'top-left': 'bottom-full left-0 mb-2'
  }[adjustedPosition];

  return (
    <div className="relative" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <PopoverContext.Provider value={{ close: handleClose }}>
          <div 
            className={`absolute ${positionClasses} min-w-[192px] max-w-xs max-h-96 overflow-auto flex flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background px-1 py-1 shadow-lg z-50 ${className}`}
          >
            {children}
          </div>
        </PopoverContext.Provider>
      )}
    </div>
  );
}

// Popover menu item component for consistent styling
interface PopoverItemProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}

export function PopoverItem({ 
  onClick, 
  children, 
  icon,
  variant = 'default',
  className = '' 
}: PopoverItemProps) {
  const context = useContext(PopoverContext);
  const variantClasses = {
    default: 'text-default-font',
    danger: 'text-error-600'
  }[variant];

  const handleClick = () => {
    onClick();
    context?.close();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-3 hover:bg-neutral-100 active:bg-neutral-50 ${className}`}
    >
      {icon && (
        <span className="text-body font-body text-default-font">
          {icon}
        </span>
      )}
      <span className={`line-clamp-1 grow shrink-0 basis-0 text-left text-body font-body ${variantClasses}`}>
        {children}
      </span>
    </button>
  );
}

// Popover separator component
export function PopoverSeparator() {
  return (
    <div className="flex w-full items-start gap-2 px-1 py-1">
      <div className="flex h-px grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-200" />
    </div>
  );
}

// Popover label component
interface PopoverLabelProps {
  children: React.ReactNode;
}

export function PopoverLabel({ children }: PopoverLabelProps) {
  return (
    <div className="px-3 py-2 text-caption font-caption text-subtext-color">
      {children}
    </div>
  );
}