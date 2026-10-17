type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <span className={`brand-mark ${className}`.trim()}>
      <span className="brand-mark__accent" aria-hidden="true" />
      <span>Dulce Momento</span>
    </span>
  );
}
