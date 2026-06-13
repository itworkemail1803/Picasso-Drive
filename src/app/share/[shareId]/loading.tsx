export default function ShareLoading(): JSX.Element {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f1f5f9",
        padding: "2rem 1rem",
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1e293b",
          paddingBottom: "1.5rem",
        }}
      >
        <div>
          <div
            style={{
              width: "200px",
              height: "28px",
              background: "#1e293b",
              borderRadius: "6px",
              marginBottom: "8px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "140px",
              height: "16px",
              background: "#1e293b",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite 0.2s",
            }}
          />
        </div>
      </div>

      {/* Grid skeleton */}
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "4/3",
              background: "#1e293b",
              borderRadius: "12px",
              animation: `pulse 1.5s ease-in-out infinite ${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
