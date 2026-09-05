import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

/**
 * Interface definition for the SearchScrollContext state and actions.
 */
interface ISearchScrollContext {
  /** Indicates whether the currently mounted view exposes a searchable list */
  isSearchAvailable: boolean;
  /** Sets whether search is available in the current view */
  setSearchAvailable: (available: boolean) => void;
  /** Indicates whether the user has scrolled past the in-content search bar threshold */
  isScrolledPastSearch: boolean;
  /** Updates whether the scroll position is beyond the search threshold */
  setIsScrolledPastSearch: (scrolled: boolean) => void;
  /** Registers a focus callback from the view's search input element */
  registerSearchFocusHandler: (handler: (() => void) | null) => void;
  /** Triggers a smooth scroll to top and focuses the active search input */
  triggerFocusSearch: () => void;
  /** Registers the main scrollable container reference */
  registerMainContainer: (element: HTMLElement | null) => void;
}

const SearchScrollContext = createContext<ISearchScrollContext | undefined>(undefined);

/**
 * Provider component for managing scroll-responsive search interactions.
 * Connects the main scroll container, TopBar search icon, and view search inputs.
 *
 * @param {object} props - Component props containing children.
 * @param {React.ReactNode} props.children - Child elements to wrap.
 * @returns {JSX.Element} Provider wrapping children with SearchScroll context.
 */
export const SearchScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchAvailable, setSearchAvailable] = useState(false);
  const [isScrolledPastSearch, setIsScrolledPastSearch] = useState(false);
  const focusHandlerRef = useRef<(() => void) | null>(null);
  const mainContainerRef = useRef<HTMLElement | null>(null);

  const registerSearchFocusHandler = useCallback((handler: (() => void) | null) => {
    focusHandlerRef.current = handler;
  }, []);

  const registerMainContainer = useCallback((element: HTMLElement | null) => {
    mainContainerRef.current = element;
  }, []);

  const triggerFocusSearch = useCallback(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Focus search input after smooth scroll initiates
    setTimeout(() => {
      focusHandlerRef.current?.();
    }, 120);
  }, []);

  return (
    <SearchScrollContext.Provider
      value={{
        isSearchAvailable,
        setSearchAvailable,
        isScrolledPastSearch,
        setIsScrolledPastSearch,
        registerSearchFocusHandler,
        triggerFocusSearch,
        registerMainContainer,
      }}
    >
      {children}
    </SearchScrollContext.Provider>
  );
};

/**
 * Custom hook to consume the SearchScrollContext.
 *
 * @returns {ISearchScrollContext} The SearchScrollContext value.
 * @throws {Error} When used outside of a SearchScrollProvider.
 */
export const useSearchScroll = (): ISearchScrollContext => {
  const context = useContext(SearchScrollContext);
  if (!context) {
    throw new Error('useSearchScroll must be used within a SearchScrollProvider');
  }
  return context;
};
