"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      expand={false}
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-terminal-bg-elevated group-[.toaster]:text-foreground group-[.toaster]:border-terminal-border group-[.toaster]:shadow-lg",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-brand-orange group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-terminal-border group-[.toast]:text-foreground",
          success:
            "group-[.toaster]:!bg-market-up-bg group-[.toaster]:!text-market-up group-[.toaster]:!border-market-up/30",
          error:
            "group-[.toaster]:!bg-market-down-bg group-[.toaster]:!text-market-down group-[.toaster]:!border-market-down/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
