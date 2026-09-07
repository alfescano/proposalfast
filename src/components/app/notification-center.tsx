"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/notifications";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
};

export function NotificationCenter({ items, unread }: { items: Item[]; unread: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-accent" aria-hidden />
        ) : null}
      </button>
      {open ? (
        <div
          className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-3 shadow-lg"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs underline"
                onClick={() => markAllNotificationsReadAction()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-1 py-6 text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-auto">
              {items.map((item) => (
                <li key={item.id} className={cn("rounded-xl px-3 py-2 text-sm", !item.readAt && "bg-muted/60")}>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    {item.actionUrl ? (
                      <Link href={item.actionUrl} className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}>
                        Open
                      </Link>
                    ) : null}
                    {!item.readAt ? (
                      <button type="button" className="underline" onClick={() => markNotificationReadAction(item.id)}>
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
