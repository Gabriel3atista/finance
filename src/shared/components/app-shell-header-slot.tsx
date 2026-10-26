"use client";

import {
  createContext,
  useMemo,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type HeaderSlotContextValue = {
  content: ReactNode;
  setContent: (content: ReactNode) => void;
};

const HeaderSlotContext = createContext<HeaderSlotContextValue | null>(null);

export function AppShellHeaderSlotProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [content, setContent] = useState<ReactNode>(null);
  const value = useMemo(() => ({ content, setContent }), [content]);

  return (
    <HeaderSlotContext.Provider value={value}>
      {children}
    </HeaderSlotContext.Provider>
  );
}

export function AppShellHeaderSlot() {
  const context = useContext(HeaderSlotContext);
  if (!context) return null;

  return (
    <div className="max-w-[40vw] truncate text-sm font-semibold text-ink">
      {context.content}
    </div>
  );
}

export function useAppShellHeaderContent(content: ReactNode) {
  const context = useContext(HeaderSlotContext);
  const setContent = context?.setContent;

  useEffect(() => {
    if (!setContent) return;
    setContent(content);
    return () => setContent(null);
  }, [content, setContent]);
}
