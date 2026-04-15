"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CaretLeft,
  Download,
  Link as LinkIcon,
  Check,
  CalendarBlank,
  Clock,
  FileText,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { researchService, type ResearchReport } from "@/services/api/research";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PUBLICATION_LABELS: Record<string, { label: string; backHref: string; accent: string }> = {
  quarterly: {
    label: "Finance Africa Quarterly",
    backHref: "/publications/finance-africa-quarterly",
    accent: "text-brand-plum",
  },
  analysis: {
    label: "Finance Africa Insights",
    backHref: "/publications/finance-africa-insights",
    accent: "text-brand-violet",
  },
  outlook: {
    label: "AfriFin Analytics",
    backHref: "/publications/afrifin-analytics",
    accent: "text-brand-coral",
  },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PublicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const slug = params.slug as string;

  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    researchService
      .getReport(slug)
      .then((r) => setReport(r))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const pubInfo = PUBLICATION_LABELS[type] || {
    label: "Publication",
    backHref: "/publications",
    accent: "text-brand-plum",
  };

  const pdfUrl = report?.pdf_url || report?.pdf_file;
  const coverUrl = report?.image_url || report?.cover_image_url;

  const handleDownload = async () => {
    if (!report) return;
    try {
      const result = await researchService.downloadReport(report.slug);
      const url = result.pdf_url || pdfUrl;
      if (!url) {
        toast.error("No PDF attached to this report");
        return;
      }
      // Force download via blob
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${report.slug}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        toast.success("Download started");
      } catch {
        // Fallback to opening in new tab if blob fails (CORS etc)
        window.open(url, "_blank");
      }
    } catch {
      toast.error("Download failed");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-terminal-bg-elevated" />
            <div className="h-12 w-3/4 bg-terminal-bg-elevated" />
            <div className="h-6 w-1/2 bg-terminal-bg-elevated" />
            <div className="h-96 bg-terminal-bg-elevated mt-8" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notFound || !report) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-20 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="text-3xl font-serif font-bold mb-3">Publication not found</h1>
          <p className="text-muted-foreground mb-6">
            The publication you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href={pubInfo.backHref}
            className="inline-flex items-center gap-2 px-5 py-3 bg-brand-plum text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-plum-dark"
          >
            <CaretLeft className="h-4 w-4" />
            Back to {pubInfo.label}
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>·</span>
          <Link href={pubInfo.backHref} className="hover:text-foreground">{pubInfo.label}</Link>
          <span>·</span>
          <span className="text-foreground line-clamp-1">{report.title}</span>
        </nav>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12"
        >
          {/* Cover */}
          <div className="md:col-span-4">
            <div className="relative aspect-[3/4] bg-terminal-bg-elevated overflow-hidden border border-terminal-border">
              {coverUrl ? (
                <Image src={coverUrl} alt={report.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <FileText className="h-20 w-20" weight="thin" />
                </div>
              )}
              {report.is_new && (
                <div
                  className="absolute top-0 left-0 bg-brand-coral text-white text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-2"
                  style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)" }}
                >
                  NEW
                </div>
              )}
            </div>
          </div>

          {/* Meta + actions */}
          <div className="md:col-span-8 flex flex-col">
            <div className={cn("text-xs font-medium uppercase tracking-[0.15em] mb-3", pubInfo.accent)}>
              {pubInfo.label}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {report.title}
            </h1>
            {report.subtitle && (
              <p className="text-lg text-muted-foreground mb-6 font-serif-body leading-relaxed">
                {report.subtitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              {report.published_at && (
                <span className="flex items-center gap-1.5">
                  <CalendarBlank className="h-4 w-4" />
                  {formatDate(report.published_at)}
                </span>
              )}
              {report.read_time_minutes ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {report.read_time_minutes} min read
                </span>
              ) : null}
              {report.page_count ? (
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  {report.page_count} pages
                </span>
              ) : null}
              <span>{report.view_count?.toLocaleString() || 0} views</span>
              {!!report.download_count && (
                <span>{report.download_count.toLocaleString()} downloads</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-auto">
              {pdfUrl && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-3 bg-brand-coral text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-coral-dark transition-colors"
                >
                  <Download className="h-4 w-4" weight="bold" />
                  Download PDF
                </button>
              )}
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-brand-plum text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-plum-dark transition-colors"
                >
                  <ArrowSquareOut className="h-4 w-4" weight="bold" />
                  Open in new tab
                </a>
              )}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-5 py-3 border border-terminal-border text-foreground text-sm font-semibold uppercase tracking-wider hover:bg-terminal-bg-elevated transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-brand-coral" weight="bold" /> : <LinkIcon className="h-4 w-4" />}
                {copied ? "Copied" : "Share"}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Abstract */}
        {report.abstract && (
          <section className="mb-10 p-6 md:p-8 bg-terminal-bg-secondary border-l-4 border-l-brand-coral">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-brand-coral mb-3">
              Abstract
            </h2>
            <p className="font-serif-body text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
              {report.abstract}
            </p>
          </section>
        )}

        {/* PDF inline viewer */}
        {pdfUrl && (
          <section className="mb-10">
            <h2 className="text-2xl font-serif font-bold mb-4">Read Full Report</h2>
            <div className="relative w-full bg-terminal-bg-elevated border border-terminal-border" style={{ height: "85vh" }}>
              <iframe
                src={pdfUrl}
                title={report.title}
                className="w-full h-full"
                allow="fullscreen"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              PDF not loading? <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-brand-coral hover:underline">Open in new tab</a> or <button onClick={handleDownload} className="text-brand-coral hover:underline">download directly</button>.
            </p>
          </section>
        )}

        {/* HTML body content (only if no PDF or in addition) */}
        {report.content && (
          <section className="mb-10 prose-journal max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: report.content }} />
        )}

        {/* Back link */}
        <div className="border-t border-terminal-border pt-8 mt-12">
          <Link
            href={pubInfo.backHref}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <CaretLeft className="h-4 w-4" />
            All {pubInfo.label}
          </Link>
        </div>
      </article>
    </MainLayout>
  );
}
