"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export function InterviewNotifier() {
  const { user } = useUser();
  const allInterviews = useQuery(
    api.interviews.getAll,
    user ? { clerkId: user.id } : "skip"
  );

  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!allInterviews || !user) return;

    // Filter to interviews relevant to the current user (either assigned to them or created by them)
    const myInterviews = allInterviews.filter(
      (i) => i.assignedUserId === user.id || i.createdBy === user.id
    );

    const interval = setInterval(() => {
      const now = new Date();
      const currentMs = now.getTime();

      myInterviews.forEach((interview) => {
        if (interview.status !== "scheduled") return;

        const match = interview.startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return;

        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const startMs = interview.interviewDate + (hours * 60 + minutes) * 60 * 1000;
        const diffMs = startMs - currentMs;
        const diffMinutes = Math.floor(diffMs / 60000);

        // Notify if it's strictly between 0 and 10 minutes away, and we haven't notified yet.
        if (diffMinutes >= 0 && diffMinutes <= 10 && !notifiedRef.current.has(interview._id)) {
          notifiedRef.current.add(interview._id);
          toast.warning("Upcoming Interview", {
            description: `Your interview with ${interview.candidateName} starts in ${diffMinutes === 0 ? 'less than a' : diffMinutes} minute${diffMinutes > 1 ? 's' : ''}!`,
            duration: 15000,
            action: {
              label: "Dismiss",
              onClick: () => {},
            },
          });
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [allInterviews, user]);

  return null;
}
