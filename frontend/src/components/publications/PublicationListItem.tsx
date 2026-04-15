"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Download, Link as LinkIcon, Check } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ResearchReport } from "@/services/api/research";
import { researchService } from "@/services/api/research";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function formatIssueLabel(dateStr?: string, reportType?: string): string {
  if (!dateStr) return reportType?.toUpperCase() || "REPORT";
  const d = new Date(dateStr);
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  const year = d.getFullYear();
  if (reportType === "quarterly") return `Q${quarter} ${year} · QUARTERLY REVIEW`;
  if (reportType === "annual") return `${year} · ANNUAL REPORT`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}`;
}

interface Props {
  report: ResearchReport;
  featured?: boolean;
}

export function PublicationListItem({ report, featured = false }: Props) {
  const [copied, setCopied] = useState(false);

  const readUrl = `/publications/${report.report_type}/${report.slug}`;
  const pdfUrl = report.pdf_url || report.pdf_file;

  const handleDownload = async () => {
    try {
      const result = await researchService.downloadReport(report.slug);
      const url = result.pdf_url || pdfUrl;
      if (url) {
        window.open(url, "_blank");
        toast.success("Download started");
      } else {
        toast.error("No PDF available for this report");
      }
    } catch {
      // If tracking fails, try direct open anyway
      if (pdfUrl) {
        window.open(pdfUrl, "_blank");
      } else {
        toast.error("Download failed");
      }
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}${readUrl}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const coverSrc = report.image_url || report.cover_image_url;

  return (
    <motion.article
      className={cn(
        "group border border-terminal-border bg-terminal-bg-secondary overflow-hidden",
        featured && "md:grid md:grid-cols-5 md:gap-0"
      )}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {/* Cover image */}
      <div
        className={cn(
          "relative bg-terminal-bg-elevated overflow-hidden",
          featured ? "md:col-span-2 aspect-[4/5] md:aspect-auto" : "aspect-[4/5]"
        )}
      >
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={report.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <BookOpen className="h-16 w-16" weight="thin" />
          </div>
        )}

        {/* NEW badge — pennant style */}
        {report.is_new && (
          <div
            className="absolute top-0 left-0 bg-brand-coral text-white text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2"
            style={{
              clipPath: "polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%)",
            }}
          >
            NEW
          </div>
        )}

        {/* Premium badge */}
        {report.is_premium && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-brand-plum text-white text-[10px] font-bold uppercase tracking-wider">
            Premium
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex flex-col",
          featured ? "md:col-span-3 p-6 md:p-10" : "p-5"
        )}
      >
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-brand-violet mb-3">
          {formatIssueLabel(report.published_at, report.report_type)}
        </div>

        <h3
          className={cn(
            "font-serif leading-tight text-foreground group-hover:text-brand-coral transition-colors mb-3",
            featured ? "text-2xl md:text-3xl" : "text-lg"
          )}
        >
          <Link href={readUrl}>{report.title}</Link>
        </h3>

        {featured && report.abstract && (
          <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3 font-serif-body">
            {report.abstract}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
          <span>{formatDate(report.published_at)}</span>
          {report.page_count ? (
            <>
              <span>·</span>
              <span>{report.page_count} pages</span>
            </>
          ) : null}
          {report.read_time_minutes ? (
            <>
              <span>·</span>
              <span>{report.read_time_minutes} min read</span>
            </>
          ) : null}
        </div>

        {/* Action row — Swiss style, no rounded */}
        <div className="mt-auto grid grid-cols-3 divide-x divide-terminal-border border border-terminal-border">
          <Link
            href={readUrl}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-plum text-white text-xs font-semibold uppercase tracking-wider hover:bg-brand-plum-dark transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" weight="bold" />
            Read
          </Link>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-terminal-bg-elevated transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-terminal-bg-elevated transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-brand-coral" weight="bold" /> : <LinkIcon className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
