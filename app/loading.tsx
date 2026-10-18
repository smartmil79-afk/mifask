export default function Loading() {
  return (<>
    <div id="pbar" className="go" />
    <div className="grid" style={{ marginTop: 24 }}>{Array.from({ length: 8 }, (_, i) => <div className="sk" key={i}><i /><b /><u /></div>)}</div>
  </>);
}
