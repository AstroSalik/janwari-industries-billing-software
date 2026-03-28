interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] font-['IBM_Plex_Sans'] font-bold text-ji-text-dim mt-1 uppercase tracking-widest">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
