import authIllustration from '../../../assets/auth-chat-illustration.png';

export function AuthBrandMark() {
  return (
    <div className="auth-brand-mark" aria-label="ChatApp">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export default function AuthVisualPanel() {
  return (
    <aside className="auth-visual-panel">
      <div className="auth-orbit auth-orbit-top" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-bottom" aria-hidden="true" />

      <div className="auth-illustration-wrap">
        <img
          src={authIllustration}
          alt="A friendly skeleton chatting from a laptop"
          className="auth-illustration"
        />
      </div>

      <div className="auth-visual-copy">
        <h1>Turn conversations into connections.</h1>
        <p>Start for free and bring your groups, friends, and ideas together.</p>
      </div>
    </aside>
  );
}
