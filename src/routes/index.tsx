import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/app/(public)/page";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
