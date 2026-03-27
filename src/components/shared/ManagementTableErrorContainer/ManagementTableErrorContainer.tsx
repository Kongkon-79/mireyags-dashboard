"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ManagementTableErrorContainerProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

export default function ManagementTableErrorContainer({
  title = "Unable to load data",
  message,
  onRetry,
}: ManagementTableErrorContainerProps) {
  return (
    <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-[16px] border border-[#F3D4D4] bg-[#FFF7F7] px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE3E3]">
        <AlertTriangle className="h-8 w-8 text-[#D92D20]" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#242424]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#667085]">
        {message || "Something went wrong while loading the data."}
      </p>

      <Button
        type="button"
        onClick={onRetry}
        className="mt-6 h-11 rounded-[10px] px-5"
      >
        <RefreshCcw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
