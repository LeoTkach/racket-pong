"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";
import { cn } from "./utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Map<string, string>; // Map value -> label
  registerItem: (value: string, label: string) => void;
  getItemLabel: (value: string) => string | undefined; // Функция для получения label из children
  variant?: "default" | "outline";
  setVariant: (variant: "default" | "outline") => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

function Select({ value, onValueChange, defaultValue, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [open, setOpen] = React.useState(false);
  const [variant, setVariant] = React.useState<"default" | "outline">("default");
  const itemsRef = React.useRef<Map<string, string>>(new Map());
  const rootRef = React.useRef<HTMLDivElement>(null);
  
  // Вычисляем ширину синхронно из children при монтировании
  const maxItemWidth = React.useMemo(() => {
    // Рекурсивно ищем все SelectItem в children
    const findSelectItems = (node: React.ReactNode): string[] => {
      const texts: string[] = [];
      
      if (React.isValidElement(node)) {
        // Проверяем, является ли это SelectItem по наличию value prop
        if (node.props?.value !== undefined) {
          const itemText = typeof node.props.children === 'string' 
            ? node.props.children 
            : (React.isValidElement(node.props.children) 
              ? (typeof node.props.children.props?.children === 'string' 
                ? node.props.children.props.children 
                : String(node.props.children || ''))
              : String(node.props.children || ''));
          if (itemText) texts.push(itemText);
        }
        
        // Рекурсивно проверяем children
        if (node.props?.children) {
          React.Children.forEach(node.props.children, (child) => {
            texts.push(...findSelectItems(child));
          });
        }
      } else if (Array.isArray(node)) {
        node.forEach((item) => {
          texts.push(...findSelectItems(item));
        });
      }
      
      return texts;
    };
    
    const itemTexts = findSelectItems(children);
    if (itemTexts.length === 0) return null;
    
    // Вычисляем максимальную ширину
    let maxWidth = 0;
    itemTexts.forEach((itemText) => {
      // Создаем временный элемент для измерения
      const measureEl = document.createElement('span');
      measureEl.style.visibility = 'hidden';
      measureEl.style.position = 'absolute';
      measureEl.style.whiteSpace = 'nowrap';
      measureEl.style.fontSize = '0.875rem'; // text-sm
      measureEl.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
      measureEl.style.fontWeight = '400';
      measureEl.textContent = itemText;
      document.body.appendChild(measureEl);
      const textWidth = measureEl.offsetWidth;
      document.body.removeChild(measureEl);
      
      // Учитываем:
      // - padding trigger слева (px-3 = 12px)
      // - padding trigger справа (px-3 = 12px) 
      // - ширина шеврона (size-4 = 16px) + gap (gap-2 = 8px)
      const itemTotalWidth = textWidth + 12 + 12 + 16 + 8;
      maxWidth = Math.max(maxWidth, itemTotalWidth);
    });
    
    return maxWidth > 0 ? maxWidth : null;
  }, [children]);
  
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  }, [isControlled, onValueChange]);

  const registerItem = React.useCallback((value: string, label: string) => {
    itemsRef.current.set(value, label);
    // Ширина уже вычислена синхронно в useMemo, не нужно пересчитывать
  }, []);

  // Функция для получения label из children (даже если items еще не зарегистрированы)
  const getItemLabel = React.useCallback((value: string): string | undefined => {
    // Сначала проверяем зарегистрированные items
    if (itemsRef.current.has(value)) {
      return itemsRef.current.get(value);
    }
    
    // Если не найдено, ищем в children
    const findLabelInChildren = (node: React.ReactNode): string | undefined => {
      if (React.isValidElement(node)) {
        // Проверяем, является ли это SelectItem с нужным value
        if (node.props?.value === value) {
          const children = node.props.children;
          if (typeof children === 'string') {
            return children;
          }
          if (React.isValidElement(children)) {
            return typeof children.props?.children === 'string' 
              ? children.props.children 
              : String(children.props?.children || '');
          }
          return String(children || '');
        }
        
        // Рекурсивно проверяем children
        if (node.props?.children) {
          const result = findLabelInChildren(node.props.children);
          if (result) return result;
        }
      } else if (Array.isArray(node)) {
        for (const item of node) {
          const result = findLabelInChildren(item);
          if (result) return result;
        }
      }
      
      return undefined;
    };
    
    return findLabelInChildren(children);
  }, [children]);

  const contextValue = React.useMemo<SelectContextValue>(() => ({
    value: currentValue,
    onValueChange: handleValueChange,
    open,
    onOpenChange: setOpen,
    items: itemsRef.current,
    registerItem,
    getItemLabel,
    variant,
    setVariant,
  }), [currentValue, handleValueChange, open, registerItem, getItemLabel, variant]);

  // Закрываем при клике вне компонента
  React.useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-select-root]')) {
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Закрываем при нажатии Escape
  React.useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);


  return (
    <SelectContext.Provider value={contextValue}>
      <div 
        ref={rootRef}
        data-select-root 
        className="relative"
        style={maxItemWidth ? { width: `${maxItemWidth}px`, minWidth: `${maxItemWidth}px` } : undefined}
      >
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within Select");
  }
  return context;
}

const selectTriggerVariants = cva(
  "data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] !cursor-pointer hover:!cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8",
  {
    variants: {
      variant: {
        default:
          "bg-input-background border-input dark:bg-input/30 dark:hover:bg-input/50",
        outline:
          "bg-background border text-foreground shadow-sm hover:bg-muted dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof selectTriggerVariants> & {
      size?: "sm" | "default";
      children: React.ReactNode;
    }
>(({ className, size = "default", variant = "default", children, ...props }, ref) => {
    const { open, onOpenChange, setVariant } = useSelectContext();
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    
    // Сохраняем variant в контекст при изменении
    React.useEffect(() => {
      setVariant(variant);
    }, [variant, setVariant]);
    
    // Комбинируем refs
    React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);
    
    return (
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        data-slot="select-trigger"
        data-size={size}
        className={cn(selectTriggerVariants({ variant, className }))}
        onClick={() => onOpenChange(!open)}
        {...props}
      >
        <span className="flex-1 text-left overflow-visible">
          {children}
        </span>
        <ChevronDownIcon 
          className={cn(
            "size-4 opacity-50 transition-transform pointer-events-none shrink-0",
            open && "rotate-180"
          )} 
        />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

function SelectValue({ placeholder, children }: SelectValueProps) {
  const { value, items, getItemLabel } = useSelectContext();
  
  // Если есть children, используем их (для кастомного отображения)
  if (children) {
    return (
      <span 
        data-slot="select-value"
        className="flex items-center gap-2 whitespace-nowrap"
      >
        {children}
      </span>
    );
  }
  
  // Получаем label для текущего value
  const displayValue = React.useMemo(() => {
    if (!value) {
      return placeholder || "";
    }
    
    // Сначала пытаемся найти в зарегистрированных items
    const registeredLabel = items.get(value);
    if (registeredLabel) {
      return registeredLabel;
    }
    
    // Если не найдено, используем getItemLabel для поиска в children
    const labelFromChildren = getItemLabel(value);
    if (labelFromChildren) {
      return labelFromChildren;
    }
    
    // Если не найдено, ищем в DOM (для случаев, когда items еще не зарегистрированы)
    const root = document.querySelector('[data-select-root]');
    if (root) {
      const item = root.querySelector(`[data-slot="select-item"][data-value="${value}"]`);
      if (item) {
        const textElement = item.querySelector('span:first-child') || item;
        const text = textElement.textContent?.trim() || value;
        return text;
      }
    }
    
    // Если ничего не найдено, используем value
    return value;
  }, [value, items, placeholder, getItemLabel]);
  
  return (
    <span 
      data-slot="select-value"
      className="flex items-center gap-2 whitespace-nowrap"
    >
      {displayValue}
    </span>
  );
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange, variant = "default" } = useSelectContext();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLElement | null>(null);
    
    // Комбинируем refs
    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    // Позиционирование относительно trigger
    React.useEffect(() => {
      if (!open || !contentRef.current) return;
      
      const root = document.querySelector('[data-select-root]') as HTMLElement;
      if (!root) return;
      
      const trigger = root.querySelector('[data-slot="select-trigger"]') as HTMLElement;
      if (!trigger) return;
      
      triggerRef.current = trigger;
      const triggerRect = trigger.getBoundingClientRect();
      const content = contentRef.current;
      
      // Отступ между триггером и выпадающим списком (4px = 0.25rem)
      const gap = 4;
      
      // Позиционируем dropdown
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const shouldPlaceAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
      
      content.style.position = "fixed";
      content.style.left = `${triggerRect.left}px`;
      content.style.width = `${triggerRect.width}px`; // Временно устанавливаем ширину trigger
      content.style.minWidth = `${triggerRect.width}px`; // Минимум - ширина trigger
      
      // Используем уже вычисленную ширину из root (синхронно, без requestAnimationFrame)
      // Получаем ширину из root (которая уже вычислена синхронно)
      const rootWidth = root.style.width || window.getComputedStyle(root).width;
      if (rootWidth && rootWidth !== 'auto') {
        content.style.width = rootWidth;
        content.style.minWidth = rootWidth;
      } else {
        // Если ширина еще не установлена, используем ширину trigger
        content.style.width = `${triggerRect.width}px`;
        content.style.minWidth = `${triggerRect.width}px`;
      }
      
      // Функция для позиционирования контента
      const positionContent = (rect: DOMRect, placeAbove: boolean) => {
        if (placeAbove) {
          // Позиционируем сверху: нижний край списка должен быть выше верха триггера на gap
          // bottom = расстояние от низа viewport до (верха триггера - gap)
          // bottom = window.innerHeight - (rect.top - gap) = window.innerHeight - rect.top + gap
          content.style.bottom = `${window.innerHeight - rect.top + gap}px`;
          content.style.top = "auto";
        } else {
          // Позиционируем снизу: top списка = bottom триггера + gap
          content.style.top = `${rect.bottom + gap}px`;
          content.style.bottom = "auto";
        }
      };
      
      positionContent(triggerRect, shouldPlaceAbove);
      
      // Обновляем позицию при скролле
      const updatePosition = () => {
        if (!open || !trigger || !content || !root) return;
        const rect = trigger.getBoundingClientRect();
        
        // Используем ширину из root (которая уже вычислена)
        const rootWidth = root.style.width || window.getComputedStyle(root).width || `${rect.width}px`;
        
        content.style.left = `${rect.left}px`;
        content.style.width = rootWidth;
        content.style.minWidth = rootWidth;
        positionContent(rect, shouldPlaceAbove);
      };
      
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [open]);

    if (!open) return null;

    // Определяем стили фона и границы в зависимости от variant
    const contentStyles = variant === "outline" 
      ? "bg-background border shadow-sm dark:bg-input/30 dark:border-input" 
      : "bg-input-background border shadow-lg";

    return (
      <div
        ref={contentRef}
        data-slot="select-content"
        data-state={open ? "open" : "closed"}
        className={cn(
          "text-popover-foreground z-50 rounded-md overflow-hidden",
          contentStyles,
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          padding: "4px 4px 4px 4px", // Отступ от края списка (одинаковый со всех сторон)
        }}
        {...props}
      >
        <div className="flex flex-col gap-1">
          {children}
        </div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, registerItem } = useSelectContext();
    const isSelected = selectedValue === value;
    
    // Регистрируем item при монтировании
    React.useEffect(() => {
      const label = typeof children === 'string' ? children : (children as React.ReactElement)?.props?.children || value;
      registerItem(value, String(label));
    }, [value, children, registerItem]);
    
    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-slot="select-item"
        data-value={value}
        className={cn(
          "relative flex w-full cursor-pointer items-center gap-2 rounded-sm text-sm outline-none select-none transition-colors",
          "h-9", // Фиксированная высота для всех вариантов
          "px-3", // Отступ слева
          "pr-3", // Отступ справа
          "my-0", // Отступ убираем, так как используем gap в контейнере
          // Hover для невыбранных элементов - primary цвет
          !isSelected && "hover:bg-accent hover:text-accent-foreground",
          // Focus для невыбранных элементов
          !isSelected && "focus:bg-accent focus:text-accent-foreground",
          // Выделение выбранного - primary цвет
          isSelected && "bg-primary text-primary-foreground",
          // Hover для выбранного элемента - более темный оттенок primary
          isSelected && "hover:bg-primary/90 hover:brightness-95",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        <span className="flex-1 whitespace-nowrap overflow-visible">
          {children}
        </span>
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function SelectGroup({ className, children, ...props }: SelectGroupProps) {
  return (
    <div
      data-slot="select-group"
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SelectLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function SelectLabel({ className, children, ...props }: SelectLabelProps) {
  return (
    <div
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  selectTriggerVariants,
};

