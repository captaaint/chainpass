import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  CirclePlus,
  ExternalLink,
  QrCode,
  RadioTower,
  ScanLine,
  Search,
  Ticket,
  WalletCards,
} from "lucide-react";

type Tone = "neutral" | "success" | "info" | "warning" | "danger";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const toneStyles: Record<Tone, string> = {
  neutral: "bg-[var(--ce-surface-container-low)] text-[var(--ce-on-surface-variant)]",
  success: "bg-[var(--ce-success-container)] text-[var(--ce-success)]",
  info: "bg-[var(--ce-info-container)] text-[var(--ce-info)]",
  warning: "bg-[var(--ce-warning-container)] text-[var(--ce-warning)]",
  danger: "bg-[var(--ce-error-container)] text-[var(--ce-error)]",
};

export interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

export function Badge({ children, tone = "neutral" }: Readonly<BadgeProps>) {
  return (
    <span className={cx("ce-label inline-flex w-fit items-center gap-1 rounded-full px-3 py-1", toneStyles[tone])}>
      {children}
    </span>
  );
}

export interface PanelProps {
  children: ReactNode;
  className?: string;
  emphasis?: "plain" | "soft" | "strong";
}

export function Panel({ children, className, emphasis = "plain" }: Readonly<PanelProps>) {
  return (
    <section
      className={cx(
        "rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-lowest)]",
        emphasis === "soft" && "bg-[var(--ce-surface-container-low)]",
        emphasis === "strong" && "border-black shadow-[var(--ce-shadow-soft)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}

export function Button({
  children,
  className,
  disabled,
  onClick,
  tone = "primary",
  type = "button",
}: Readonly<ButtonProps>) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--ce-radius)] px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ce-secondary)] disabled:opacity-50",
        tone === "primary" &&
          "bg-[var(--ce-secondary)] text-[var(--ce-on-secondary)] hover:bg-[var(--ce-on-secondary-container)]",
        tone === "secondary" &&
          "border border-[var(--ce-outline-variant)] bg-white text-[var(--ce-on-surface)] hover:border-[var(--ce-outline)]",
        tone === "danger" &&
          "border border-[var(--ce-error)] bg-white text-[var(--ce-error)] hover:bg-[var(--ce-error-container)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export interface ButtonLinkProps {
  children: ReactNode;
  href: string;
  className?: string;
  tone?: "primary" | "secondary";
}

export function ButtonLink({
  children,
  href,
  className,
  tone = "primary",
}: Readonly<ButtonLinkProps>) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--ce-radius)] px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ce-secondary)]",
        tone === "primary" &&
          "bg-[var(--ce-secondary)] text-[var(--ce-on-secondary)] hover:bg-[var(--ce-on-secondary-container)]",
        tone === "secondary" &&
          "border border-[var(--ce-outline-variant)] bg-white text-[var(--ce-on-surface)] hover:border-[var(--ce-outline)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export interface PageIntroProps {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageIntro({ eyebrow, title, description, action }: Readonly<PageIntroProps>) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow ? <div className="ce-label mb-6 uppercase text-[var(--ce-on-surface-variant)]">{eyebrow}</div> : null}
        <h1 className="text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-[var(--ce-on-surface)] md:text-[36px] md:leading-[44px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-base leading-6 text-[var(--ce-on-surface-variant)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export interface FieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  helper?: ReactNode;
  defaultValue?: string;
}

export function Field({
  label,
  placeholder,
  type = "text",
  helper,
  defaultValue,
}: Readonly<FieldProps>) {
  return (
    <label className="grid gap-2">
      <span className="ce-label text-[var(--ce-on-surface-variant)]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="min-h-11 rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface)] px-4 text-sm text-[var(--ce-on-surface)] outline-none transition placeholder:text-[#7a8290] focus:border-[var(--ce-secondary)]"
      />
      {helper ? <span className="ce-label text-[var(--ce-success)]">{helper}</span> : null}
    </label>
  );
}

export interface TextAreaFieldProps {
  label: string;
  placeholder?: string;
}

export function TextAreaField({ label, placeholder }: Readonly<TextAreaFieldProps>) {
  return (
    <label className="grid gap-2">
      <span className="ce-label text-[var(--ce-on-surface-variant)]">{label}</span>
      <textarea
        placeholder={placeholder}
        rows={5}
        className="min-h-32 resize-y rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface)] px-4 py-3 text-sm leading-6 text-[var(--ce-on-surface)] outline-none transition placeholder:text-[#7a8290] focus:border-[var(--ce-secondary)]"
      />
    </label>
  );
}

export interface StatusCalloutProps {
  icon?: ComponentType<{ size?: number; "aria-hidden"?: boolean; className?: string }>;
  title: string;
  children: ReactNode;
  tone?: Tone;
}

export function StatusCallout({
  icon: Icon = CircleAlert,
  title,
  children,
  tone = "neutral",
}: Readonly<StatusCalloutProps>) {
  return (
    <Panel
      className={cx(
        "flex items-start gap-4 border-l-4 p-5",
        tone === "success" && "border-l-[var(--ce-success)]",
        tone === "warning" && "border-l-[var(--ce-warning)]",
        tone === "danger" && "border-l-[var(--ce-error)]",
        tone === "neutral" && "border-l-[var(--ce-outline-variant)]",
      )}
    >
      <span className={cx("flex size-12 shrink-0 items-center justify-center rounded-full", toneStyles[tone])}>
        <Icon size={22} aria-hidden={true} />
      </span>
      <div>
        <h3 className="text-lg font-semibold leading-6">{title}</h3>
        <div className="ce-label mt-1 text-[var(--ce-on-surface-variant)]">{children}</div>
      </div>
    </Panel>
  );
}

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export function MetricCard({ label, value, detail }: Readonly<MetricCardProps>) {
  return (
    <Panel className="p-6">
      <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">{label}</p>
      <div className="mt-3 text-[30px] font-bold leading-[38px] text-[var(--ce-on-surface)]">{value}</div>
      {detail ? <div className="mt-1 text-sm text-[var(--ce-on-surface-variant)]">{detail}</div> : null}
    </Panel>
  );
}

export interface TicketPreviewCardProps {
  title: string;
  subtitle: string;
  id: string;
  badge: string;
  variant?: "cyan" | "mono" | "gold";
  disabled?: boolean;
  highlighted?: boolean;
  externalHref?: string;
}

export function TicketPreviewCard({
  title,
  subtitle,
  id,
  badge,
  variant = "cyan",
  disabled,
  highlighted,
  externalHref,
}: Readonly<TicketPreviewCardProps>) {
  return (
    <article
      className={cx(
        "overflow-hidden rounded-[var(--ce-radius-lg)] border bg-white shadow-[var(--ce-shadow-soft)]",
        highlighted ? "border-[var(--ce-secondary)] ring-1 ring-[var(--ce-secondary)]" : "border-[var(--ce-outline-variant)]",
        disabled && "opacity-60",
      )}
    >
      <div
        className={cx(
          "relative h-48",
          variant === "cyan" &&
            "bg-[radial-gradient(circle_at_50%_40%,rgba(87,223,254,.78),transparent_28%),linear-gradient(135deg,#07111f,#0e3e49_58%,#05080e)]",
          variant === "mono" &&
            "bg-[radial-gradient(circle_at_50%_35%,#e7e9ee,transparent_38%),linear-gradient(90deg,#16191f,#f3f4f7_48%,#1c2026)] grayscale",
          variant === "gold" &&
            "bg-[radial-gradient(circle_at_72%_25%,rgba(255,181,91,.9),transparent_20%),linear-gradient(135deg,#07111f,#0c1b2d_45%,#d8903b)]",
        )}
      >
        <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold">
          Access Pass
        </div>
        <div className="absolute right-4 top-4">
          <Badge tone={highlighted ? "info" : disabled ? "neutral" : "success"}>{badge}</Badge>
        </div>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-semibold leading-7">{title}</h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-[var(--ce-on-surface-variant)]">
          <CalendarDays size={15} aria-hidden="true" />
          {subtitle}
        </p>
        <div className="mt-4 flex items-center justify-between rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)] p-3">
          <div>
            <p className="ce-label-sm uppercase text-[var(--ce-on-surface-variant)]">Token ID</p>
            <p className="ce-label text-[var(--ce-on-surface)]">#{id}</p>
          </div>
          <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
        </div>
        <div className="mt-4 grid gap-2 border-t border-dashed border-[var(--ce-outline-variant)] pt-4">
          <Button className="w-full" disabled={disabled}>
            <QrCode size={16} aria-hidden="true" />
            {disabled ? "Ticket Redeemed" : "Show QR Code"}
          </Button>
          {externalHref ? (
            <a
              href={externalHref}
              target="_blank"
              rel="noreferrer"
              className="ce-label inline-flex items-center justify-center gap-2 text-[var(--ce-secondary)]"
            >
              View on Etherscan <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export interface SearchToolbarProps {
  placeholder?: string;
}

export function SearchToolbar({ placeholder = "Search tickets..." }: Readonly<SearchToolbarProps>) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <label className="relative min-w-0 flex-1">
        <Search
          size={22}
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ce-on-surface-variant)]"
        />
        <input
          placeholder={placeholder}
          className="min-h-12 w-full rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[var(--ce-secondary)]"
        />
      </label>
      <Button tone="secondary">
        <RadioTower size={17} aria-hidden="true" />
        Filter
      </Button>
    </div>
  );
}

export interface ScannerViewportProps {
  children?: ReactNode;
}

export function ScannerViewport({ children }: Readonly<ScannerViewportProps>) {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-[linear-gradient(135deg,#06101c,#102a32_52%,#05080e)]">
      <div className="absolute inset-[18%] border border-[var(--ce-secondary)] opacity-70 shadow-[0_0_28px_rgba(87,223,254,.22)]" />
      <div className="absolute right-6 top-6 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
        <span className="mr-1 text-red-400">●</span> REC 4K
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-sm text-[var(--ce-inverse-on-surface)]">
        <ScanLine size={42} aria-hidden="true" />
        Camera preview appears here
      </div>
      {children}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  detail: string;
}

export function EmptyState({ title, detail }: Readonly<EmptyStateProps>) {
  return (
    <div className="rounded-[var(--ce-radius-lg)] border border-dashed border-[var(--ce-outline-variant)] p-10 text-center text-[var(--ce-on-surface-variant)]">
      <CirclePlus className="mx-auto opacity-40" size={42} aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm">{detail}</p>
    </div>
  );
}

export { BadgeCheck, WalletCards };
