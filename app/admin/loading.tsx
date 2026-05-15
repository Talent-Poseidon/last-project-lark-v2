export default function AdminLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
        <div className="h-7 w-36 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["User", "Provider", "Role", "Status", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                      <div>
                        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                        <div className="mt-1 h-3 w-36 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-18 animate-pulse rounded-full bg-muted" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
