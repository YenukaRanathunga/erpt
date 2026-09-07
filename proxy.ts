import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk enriches requests for the separate Super Admin fallback, while server
// pages and API handlers enforce either that identity or an EMP session.
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
