import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export default async function RoomsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Next.js 15 => cookies() is async, so we must await it
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");  // change if your login route is different
  }

  const payload = verifyToken(token);

  if (!payload) {
    redirect("/login");
  }

  return <>{children}</>;
}
