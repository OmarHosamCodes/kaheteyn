import type { AppRouter } from "@kaheteyn/api/routers/index";
import { Toaster } from "@kaheteyn/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { ConfirmProvider } from "../components/confirm";

import appCss from "../index.css?url";

export interface RouterAppContext {
	trpc: TRPCOptionsProxy<AppRouter>;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "كهاتين — نظام إدارة كفالة الأيتام" },
			{
				name: "description",
				content:
					"نظام إدارة كفالة الأيتام · Kaheteyn — Orphan Sponsorship Register",
			},
			// Theme color = Olive Guardian (brand structural accent)
			{ name: "theme-color", content: "#1F5830" },
			{ name: "application-name", content: "Kaheteyn" },
			{ name: "apple-mobile-web-app-title", content: "كهاتين" },
			{ name: "apple-mobile-web-app-capable", content: "yes" },
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default",
			},
			// Open Graph
			{ property: "og:type", content: "website" },
			{
				property: "og:title",
				content: "كهاتين — نظام إدارة كفالة الأيتام",
			},
			{
				property: "og:description",
				content: "Kaheteyn · The Trusted Register for orphan sponsorship.",
			},
			{ property: "og:image", content: "/og-image.png" },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ property: "og:locale", content: "ar_PS" },
			// Twitter
			{ name: "twitter:card", content: "summary_large_image" },
			{
				name: "twitter:title",
				content: "كهاتين — نظام إدارة كفالة الأيتام",
			},
			{
				name: "twitter:description",
				content: "Kaheteyn · The Trusted Register for orphan sponsorship.",
			},
			{ name: "twitter:image", content: "/og-image.png" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			// Favicons
			{ rel: "icon", href: "/favicon.ico", sizes: "any" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png",
				sizes: "180x180",
			},
			{ rel: "manifest", href: "/site.webmanifest" },
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap",
			},
		],
		scripts: [
			{
				src: "https://tweakcn.com/live-preview.min.js",
			},
		],
	}),

	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="ar" dir="rtl">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-svh bg-background text-foreground">
				<ConfirmProvider>
					<Outlet />
					<Toaster richColors position="top-center" dir="rtl" />
				</ConfirmProvider>
				<TanStackRouterDevtools position="bottom-left" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
