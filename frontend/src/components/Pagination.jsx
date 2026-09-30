export default function Pagination({ page, pageCount, total, pageSize, pageSizes = [10, 25, 50], onPage, onPageSize }) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="table-pagination">
      <div className="pagination-info">
        Showing {start}-{end} of {total.toLocaleString()}
        <select className="select-input select-sm" value={pageSize} aria-label="Rows per page"
                onChange={(e) => onPageSize(Number(e.target.value))}>
          {pageSizes.map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
      <div className="pagination-controls">
        <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(1)}>« First</button>
        <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</button>
        <span className="pagination-page">Page {page} of {pageCount}</span>
        <button type="button" className="btn-outline btn-sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>Next ›</button>
        <button type="button" className="btn-outline btn-sm" disabled={page >= pageCount} onClick={() => onPage(pageCount)}>Last »</button>
      </div>
    </div>
  );
}