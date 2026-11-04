export default function Avatar({ url, name, size = 34 }: { url?: string | null; name: string; size?: number }) {
  return (<span className="pava" style={{ width: size, height: size, fontSize: size * 0.42 }}>{url ? <img src={url} alt="" /> : (name[0] || "M").toUpperCase()}</span>);
}
