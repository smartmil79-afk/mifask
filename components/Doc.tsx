export default function Doc({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="box" style={{ maxWidth: 760, lineHeight: 1.6 }}><h2 style={{ marginTop: 0 }}>{title}</h2>{children}</div>;
}
