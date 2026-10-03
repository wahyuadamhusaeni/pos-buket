import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface SearchableOption {
    value: string | number;
    label: string;
    sublabel?: string;
    badge?: string;
    badgeColor?: string;
    disabled?: boolean;
}

interface SearchableSelectProps {
    id?: string;
    options: SearchableOption[];
    value?: string | number | null;
    onChange: (value: any) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'default';
}

interface DropdownCoords {
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
    maxHeight: number;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function SearchableSelect({
    id,
    options,
    value,
    onChange,
    placeholder = 'Pilih salah satu...',
    searchPlaceholder = 'Cari nama bahan / item...',
    emptyMessage = 'Tidak ada pilihan yang cocok',
    disabled = false,
    className = '',
    size = 'default',
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState<DropdownCoords | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Selected option
    const selectedOption = useMemo(() => {
        if (value === null || value === undefined || value === '') return undefined;
        return options.find((opt) => String(opt.value) === String(value));
    }, [options, value]);

    // Filtered options based on search query
    const filteredOptions = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return options;
        return options.filter((opt) => {
            const matchLabel = opt.label.toLowerCase().includes(query);
            const matchSub = opt.sublabel?.toLowerCase().includes(query);
            const matchBadge = opt.badge?.toLowerCase().includes(query);
            return matchLabel || matchSub || matchBadge;
        });
    }, [options, search]);

    // Reset highlighted index whenever filter changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [search]);

    // Calculate position for the floating portal dropdown
    const calculatePosition = (): DropdownCoords | null => {
        if (!triggerButtonRef.current) return null;
        const rect = triggerButtonRef.current.getBoundingClientRect();

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const spaceBelow = viewportHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;

        // Open upwards if not enough space below (< 220px) and above has more room
        const openUpwards = spaceBelow < 220 && spaceAbove > spaceBelow;
        const maxHeight = openUpwards
            ? Math.max(140, Math.min(320, spaceAbove))
            : Math.max(140, Math.min(320, spaceBelow));

        const minWidth = Math.min(280, viewportWidth - 24);
        const width = Math.min(viewportWidth - 24, Math.max(rect.width, minWidth));

        let left = rect.left;
        if (left + width > viewportWidth - 12) {
            left = Math.max(12, viewportWidth - width - 12);
        }
        if (left < 12) {
            left = 12;
        }

        return {
            top: openUpwards ? rect.top - 6 : rect.bottom + 6,
            left,
            width,
            openUpwards,
            maxHeight,
        };
    };

    const openDropdown = () => {
        if (disabled) return;
        const nextCoords = calculatePosition();
        if (nextCoords) {
            setCoords(nextCoords);
        }
        setIsOpen(true);
        setSearch('');
    };

    const closeDropdown = () => {
        setIsOpen(false);
        setSearch('');
    };

    // Auto focus search input when opened
    useIsomorphicLayoutEffect(() => {
        if (isOpen) {
            // Position first
            const nextCoords = calculatePosition();
            if (nextCoords) {
                setCoords(nextCoords);
            }
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Track scroll & resize to update dropdown position or close if scrolled away
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (!triggerButtonRef.current) return;
            const rect = triggerButtonRef.current.getBoundingClientRect();

            // If trigger button is completely outside the viewport, close dropdown
            if (rect.bottom < 0 || rect.top > window.innerHeight) {
                setIsOpen(false);
                return;
            }

            const next = calculatePosition();
            if (next) {
                setCoords(next);
            }
        };

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // Close on click outside (check both trigger button and floating portal menu)
    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (containerRef.current && containerRef.current.contains(target)) {
                return;
            }
            if (dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }
            closeDropdown();
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
        };
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDropdown();
                triggerButtonRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSelect = (val: string | number) => {
        onChange(val);
        closeDropdown();
        triggerButtonRef.current?.focus();
    };

    // Keyboard navigation inside search input
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => (filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                filteredOptions.length > 0 ? (prev - 1 + filteredOptions.length) % filteredOptions.length : 0
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
                const opt = filteredOptions[highlightedIndex];
                if (!opt.disabled) {
                    handleSelect(opt.value);
                }
            }
        }
    };

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && optionsListRef.current) {
            const highlightedEl = optionsListRef.current.children[highlightedIndex] as HTMLElement | undefined;
            if (highlightedEl) {
                highlightedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Trigger Button */}
            <button
                ref={triggerButtonRef}
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (isOpen) {
                        closeDropdown();
                    } else {
                        openDropdown();
                    }
                }}
                className={`flex w-full items-center justify-between rounded-lg border border-input bg-background ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                    size === 'sm' ? 'h-8 px-2.5 py-1 text-xs rounded-md' : 'h-10 px-3 py-2 text-sm'
                } ${isOpen ? 'ring-2 ring-rose-500/50 border-rose-500' : 'hover:border-rose-400'}`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption ? (
                        <>
                            <span className="font-medium truncate">{selectedOption.label}</span>
                            {selectedOption.badge && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0 hidden sm:inline-flex">
                                    {selectedOption.badge}
                                </Badge>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground truncate">{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-rose-500' : ''
                    }`}
                />
            </button>

            {/* Portal Dropdown Menu */}
            {mounted && isOpen && coords && typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: 'fixed',
                            left: `${coords.left}px`,
                            width: `${coords.width}px`,
                            ...(coords.openUpwards
                                ? { bottom: `${window.innerHeight - coords.top}px` }
                                : { top: `${coords.top}px` }),
                            maxHeight: `${coords.maxHeight}px`,
                            zIndex: 99999,
                        }}
                        className="flex flex-col rounded-xl border border-border/80 bg-popover p-1.5 text-popover-foreground shadow-2xl shadow-black/25 ring-1 ring-border/50 animate-in fade-in-0 zoom-in-95 duration-100 backdrop-blur-sm"
                    >
                        {/* Search Input Field */}
                        <div className="relative shrink-0 mb-1 px-1">
                            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder={searchPlaceholder}
                                className="h-8 w-full rounded-md border border-input bg-muted/40 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:bg-background focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Options List */}
                        <div
                            ref={optionsListRef}
                            className="flex-1 min-h-0 overflow-y-auto space-y-0.5 py-0.5 text-xs overscroll-contain"
                        >
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-xs text-muted-foreground">
                                    {emptyMessage}
                                </div>
                            ) : (
                                filteredOptions.map((option, idx) => {
                                    const isSelected =
                                        value !== null &&
                                        value !== undefined &&
                                        value !== '' &&
                                        String(option.value) === String(value);
                                    const isHighlighted = idx === highlightedIndex;

                                    return (
                                        <button
                                            key={String(option.value)}
                                            type="button"
                                            disabled={option.disabled}
                                            onClick={() => handleSelect(option.value)}
                                            onMouseEnter={() => setHighlightedIndex(idx)}
                                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                                                isSelected
                                                    ? 'bg-rose-500/10 text-rose-600 font-semibold dark:bg-rose-500/20 dark:text-rose-400'
                                                    : isHighlighted
                                                    ? 'bg-muted/80 text-foreground'
                                                    : 'hover:bg-muted/70 text-foreground'
                                            } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <span className="truncate">{option.label}</span>
                                                    {option.badge && (
                                                        <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                                                            {option.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {option.sublabel && (
                                                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                        {option.sublabel}
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
