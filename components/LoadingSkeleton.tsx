'use client'

export function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metrics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ padding: 20, minHeight: 88 }}>
            <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 28, width: '80%' }} />
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card" style={{ padding: 20, minHeight: 200 }}>
        <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 140 }} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 20, minHeight: 240 }}>
        <div className="skeleton" style={{ height: 14, width: '25%', marginBottom: 16 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}
          >
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ height: 12, width: '40%' }} />
              <div className="skeleton" style={{ height: 10, width: '60%' }} />
            </div>
            <div className="skeleton" style={{ height: 12, width: 50 }} />
            <div className="skeleton" style={{ height: 12, width: 50 }} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20, minHeight: 260 }}>
          <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 180 }} />
        </div>
        <div className="card" style={{ padding: 20, minHeight: 260 }}>
          <div className="skeleton" style={{ height: 14, width: '25%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '45%', marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="skeleton" style={{ height: 100, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: '80%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
