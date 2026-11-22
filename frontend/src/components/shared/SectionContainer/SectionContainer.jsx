export default function SectionContainer({
  children,
  className = "",
  as: Component = "section",
  ...props
}) {
  return (
    <Component className={`py-20 md:py-28 ${className}`} {...props}>
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">{children}</div>
    </Component>
  );
}