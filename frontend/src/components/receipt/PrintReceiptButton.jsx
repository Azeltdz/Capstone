import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useReceipt } from "../../hooks/useOrders";
import { formatOrderNumber } from "../../utils/format";
import Receipt from "./Receipt";

const PAGE_STYLE = "@page { size: 80mm auto; margin: 3mm; } body { margin: 0; }";

export default function PrintReceiptButton({
  orderId, copy = false, className = "btn-outline", style, children = "🖨 Print receipt",
}) {
  const contentRef = useRef(null);
  const { data: receipt, isLoading, error, refetch } = useReceipt(orderId);
  const print = useReactToPrint({
    contentRef,
    documentTitle: formatOrderNumber(orderId),
    pageStyle: PAGE_STYLE,
  });

  if (error && !receipt) {
    return (
      <button type="button" className={className} style={style} onClick={() => refetch()}>
        Receipt unavailable. Retry
      </button>
    );
  }

  return (
    <>
      <button type="button" className={className} style={style} onClick={() => print()} disabled={!receipt}>
        {isLoading ? "Preparing receipt…" : children}
      </button>
      {/* Kept out of view. react-to-print copies just this node into the print window. */}
      <div style={{ display: "none" }}>
        <Receipt ref={contentRef} receipt={receipt} copy={copy} />
      </div>
    </>
  );
}