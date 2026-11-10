import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error(error, info); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container" style={{ padding: '64px var(--gutter)' }}>
        <div className="alert alert-error"><AlertCircle size={18} /><div><b>This tool crashed.</b> {String(this.state.error.message || this.state.error)}<div style={{ marginTop: 10 }}><button className="btn btn-sm" onClick={() => location.reload()}>Reload</button></div></div></div>
      </div>
    );
  }
}
