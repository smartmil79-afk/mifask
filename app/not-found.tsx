import Link from "next/link";
export default function NotFound() {
  return (<div className="box" style={{ textAlign: "center" }}><h2>Page not found</h2><p className="meta">The ad or page you are looking for does not exist or was removed.</p><Link className="btn" href="/">Back to home</Link></div>);
}
