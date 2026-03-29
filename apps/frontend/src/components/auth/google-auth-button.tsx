"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 3l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2H12Z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.7 0 5-.9 6.6-2.5l-3.1-2.4c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3l-3.2 2.5C4.6 18.7 8 21 12 21Z"
      />
      <path
        fill="#FBBC05"
        d="M6.2 12.7c-.2-.6-.3-1.2-.3-1.7s.1-1.2.3-1.7L3 6.8C2.4 8 2 9.4 2 11s.4 3 1 4.2l3.2-2.5Z"
      />
      <path
        fill="#4285F4"
        d="M12 5.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.2 14.7 1 12 1 8 1 4.6 3.3 3 6.8l3.2 2.5C7 6.9 9.3 5.1 12 5.1Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  callbackUrl,
  label
}: {
  callbackUrl: string;
  label: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", {
          callbackUrl
        }).finally(() => setPending(false));
      }}
    >
      <GoogleMark />
      {pending ? "Redirecting to Google..." : label}
    </Button>
  );
}
