export default function Flash({ e, m }: { e?: string; m?: string }) {
  return (<>{e && <div className="note err" role="alert">{e}</div>}{m && <div className="note okbar">{m}</div>}</>);
}
