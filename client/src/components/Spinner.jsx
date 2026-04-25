const Spinner = () => (
  <div style={{ display: "inline-block", width: 20, height: 20 }}>
    <svg
      viewBox="0 0 24 24"
      style={{ animation: "spin 1s linear infinite", width: "100%", height: "100%" }}
    >
      <circle
        cx="12" cy="12" r="10"
        fill="none" stroke="currentColor" strokeWidth="3"
        strokeDasharray="31.4" strokeDashoffset="10"
      />
    </svg>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Spinner;
