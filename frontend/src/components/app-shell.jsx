export default function AppShell({ children, className = "" }) {
  return <main className={`page-shell ${className}`.trim()}>{children}</main>;
}
