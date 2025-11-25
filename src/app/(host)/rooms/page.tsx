import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import HostDashboard from "./HostDashboard";

const prisma = new PrismaClient();

export default async function RoomsPage() {
  // Read cookies on the server
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // No JWT cookie → redirect to login
  if (!token) redirect("/login");

  // Verify token signature
  const decoded = verifyToken(token);
  if (!decoded) redirect("/login");

  // Ensure admin actually exists in DB
  const admin = await prisma.admin.findUnique({
    where: { id: decoded.adminId },
  });

  if (!admin) redirect("/login");

  // Authenticated → load client dashboard
  return <HostDashboard admin={admin} />;
}
