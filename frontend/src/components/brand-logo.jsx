export default function BrandLogo({ alt = "BudgetApp", className = "" }) {
  return (
    <img
      src="/assets/images/logo_9_transparent.png"
      alt={alt}
      className={`brand-logo ${className}`.trim()}
      width="80"
      height="80"
    />
  );
}
