import { Button } from "@kaheteyn/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@kaheteyn/ui/components/dialog";
import { cn } from "@kaheteyn/ui/lib/utils";
import type * as React from "react";

type ImagePreviewDialogProps = {
	src: string;
	title: string;
	alt?: string;
	children: React.ReactNode;
	triggerClassName?: string;
};

export function ImagePreviewDialog({
	src,
	title,
	alt = "",
	children,
	triggerClassName,
}: ImagePreviewDialogProps) {
	return (
		<Dialog>
			<DialogTrigger
				render={
					<button
						type="button"
						aria-label={`فتح ${title}`}
						className={cn(
							"inline-flex cursor-zoom-in border-0 bg-transparent p-0 text-inherit",
							triggerClassName,
						)}
					/>
				}
			>
				{children}
			</DialogTrigger>
			<DialogContent className="max-w-4xl p-4">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="flex max-h-[75vh] justify-center overflow-auto rounded-md bg-muted/30 p-2">
					<img
						src={src}
						alt={alt}
						className="max-h-[70vh] max-w-full rounded-md object-contain"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

type ImagePreviewButtonProps = {
	src: string;
	title: string;
	alt?: string;
	className?: string;
};

export function ImagePreviewButton({
	src,
	title,
	alt = "",
	className,
}: ImagePreviewButtonProps) {
	return (
		<Dialog>
			<DialogTrigger
				render={
					<Button
						type="button"
						variant="link"
						size="sm"
						className={className}
					/>
				}
			>
				{title}
			</DialogTrigger>
			<DialogContent className="max-w-4xl p-4">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="flex max-h-[75vh] justify-center overflow-auto rounded-md bg-muted/30 p-2">
					<img
						src={src}
						alt={alt}
						className="max-h-[70vh] max-w-full rounded-md object-contain"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
