"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Pause,
  Play,
  Lightning,
} from "@phosphor-icons/react";
import { newsService } from "@/services/api/news";
import useSWR from "swr";

interface TickerArticle {
  id: string;
  title: string;
  slug: string;
  category?: { name: string; slug: string };
  is_breaking?: boolean;
  published_at?: string;
}

function TickerItem({ article }: { article: TickerArticle }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="flex items-center gap-2 px-5 py-1.5 hover:bg-terminal-bg-elevated/50 transition-colors whitespace-nowrap group"
    >
      {article.is_breaking && (
        <Lightning className="h-3 w-3 text-brand-coral flex-shrink-0" weight="fill" />
      )}
      {article.category && (
        <span className="text-brand-violet text-[10px] font-medium uppercase tracking-wider flex-shrink-0">
          {article.category.name}
        </span>
      )}
      <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
        {article.title.length > 80 ? article.title.slice(0, 80) + "..." : article.title}
      </span>
      <span className="text-muted-foreground/50 mx-2">|</span>
    </Link>
  );
}

export function NewsTicker() {
  const { data } = useSWR("news-ticker", () => newsService.getArticles({ page_size: 20 }), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    refreshInterval: 300000,
  });
  const articles = data?.results || [];
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const scrollPosition = useRef(0);
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const dragScrollStart = useRef(0);

  const tickerArticles: TickerArticle[] = articles.slice(0, 20).map((a: any) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    category: a.category,
    is_breaking: a.is_breaking,
    published_at: a.published_at,
  }));

  // Auto-scroll animation
  useEffect(() => {
    if (!scrollRef.current || isPaused || isDragging.current || tickerArticles.length === 0) return;

    const el = scrollRef.current;
    const halfWidth = el.scrollWidth / 2;
    const speed = direction === "left" ? 0.5 : -0.5;

    const animate = () => {
      scrollPosition.current += speed;

      // Loop seamlessly
      if (scrollPosition.current >= halfWidth) {
        scrollPosition.current = 0;
      } else if (scrollPosition.current < 0) {
        scrollPosition.current = halfWidth;
      }

      el.scrollLeft = scrollPosition.current;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, direction, tickerArticles.length]);

  // Mouse/touch drag for manual scrolling
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = e.clientX;
    dragScrollStart.current = scrollRef.current?.scrollLeft || 0;
    setIsPaused(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const delta = dragStart.current - e.clientX;
    scrollRef.current.scrollLeft = dragScrollStart.current + delta;
    scrollPosition.current = scrollRef.current.scrollLeft;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (tickerArticles.length === 0) return null;

  return (
    <div className="bg-terminal-bg border-b border-terminal-border select-none">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-r border-terminal-border bg-brand-plum">
          <Lightning className="h-3 w-3 text-brand-coral" weight="fill" />
          <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
            Latest
          </span>
        </div>

        {/* Scrolling news titles */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={() => { if (!isDragging.current) setIsPaused(true); }}
          onMouseLeave={() => { isDragging.current = false; setIsPaused(false); }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="flex">
            {/* Duplicate for seamless loop */}
            {[...tickerArticles, ...tickerArticles].map((article, i) => (
              <TickerItem key={`${article.id}-${i}`} article={article} />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 border-l border-terminal-border">
          <button
            onClick={() => setDirection(d => d === "left" ? "right" : "left")}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-medium"
            title="Reverse direction"
          >
            {direction === "left" ? "◀" : "▶"}
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
