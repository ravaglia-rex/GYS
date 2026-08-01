"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  const errorToasts = toasts.filter((t) => t.variant === "destructive")
  const otherToasts = toasts.filter((t) => t.variant !== "destructive")
  const activeError = errorToasts[0]

  return (
    <>
      <Dialog
        open={Boolean(activeError?.open)}
        onOpenChange={(open) => {
          if (!open && activeError) {
            dismiss(activeError.id)
          }
        }}
      >
        {activeError && (
          <DialogContent
            className="gap-0 overflow-hidden border-rose-200 bg-rose-50 p-0 text-slate-900 shadow-xl sm:max-w-md sm:rounded-2xl [&>button]:right-3 [&>button]:top-3 [&>button]:text-rose-400 [&>button]:hover:text-rose-700 [&>button]:focus:ring-rose-300 [&>button]:focus:ring-offset-rose-50"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <div className="px-6 pb-2 pt-6 pr-12">
              <DialogHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-rose-200">
                    <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1.5 pt-1">
                    <DialogTitle className="text-left text-base font-semibold leading-snug text-rose-950">
                      {activeError.title ?? "Something went wrong"}
                    </DialogTitle>
                    {activeError.description ? (
                      <DialogDescription className="text-left text-sm leading-relaxed text-rose-900/70">
                        {activeError.description}
                      </DialogDescription>
                    ) : (
                      <DialogDescription className="sr-only">
                        Please dismiss this dialog to continue.
                      </DialogDescription>
                    )}
                  </div>
                </div>
              </DialogHeader>
              {activeError.action}
            </div>
            <DialogFooter className="px-6 pb-5 pt-4 sm:justify-center">
              <Button
                type="button"
                className="w-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-600 sm:w-auto sm:min-w-[5.5rem]"
                onClick={() => dismiss(activeError.id)}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <ToastProvider>
        {otherToasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
        <ToastViewport />
      </ToastProvider>
    </>
  )
}
