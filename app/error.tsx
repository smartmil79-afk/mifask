"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (<div className="box" style={{ textAlign: "center" }}><h2>Something went wrong</h2><p className="meta">Please try again.</p><button className="btn" onClick={reset}>Try again</button></div>);
}
