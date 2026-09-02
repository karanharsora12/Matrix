import { useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useGridActions() {
  const gridRef = useRef<AgGridReact>(null);

  const getGridDataAndColumns = () => {
    if (!gridRef.current || !gridRef.current.api)
      return { data: [], columns: [] };

    const api = gridRef.current.api;
    const allColumns = api.getColumns() || [];

    const visibleColumns = allColumns
      .filter(
        (col) =>
          col.isVisible() &&
          col.getColDef().headerName &&
          col.getColDef().headerName !== "Actions",
      )
      .map((col) => ({
        headerName: col.getColDef().headerName as string,
        field: col.getColDef().field || "",
        colId: col.getColId(),
        colDef: col.getColDef(),
      }));

    const rows: any[] = [];
    api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) {
        const rowData: Record<string, any> = {};
        visibleColumns.forEach((col) => {
          let value = "";
          if (typeof col.colDef.valueGetter === "function") {
            value =
              col.colDef.valueGetter({
                data: node.data,
                node,
                colDef: col.colDef,
                api,
              } as any) ?? "";
          } else if (col.field) {
            value = node.data[col.field] ?? "";
          }
          rowData[col.headerName] = value;
        });
        rows.push(rowData);
      }
    });

    return { data: rows, columns: visibleColumns.map((c) => c.headerName) };
  };

  const onExportExcel = useCallback((filename = "export") => {
    const { data } = getGridDataAndColumns();
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }, []);

  const onExportPdf = useCallback((title = "Export", filename = "export") => {
    const { data, columns } = getGridDataAndColumns();
    if (data.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(title, 14, 15);

    const tableData = data.map((row) => columns.map((col) => row[col]));

    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`${filename}.pdf`);
  }, []);

  const onPrint = useCallback((title = "Print View") => {
    const { data, columns } = getGridDataAndColumns();
    if (data.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.head.innerHTML = `
      <title>${title}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { text-align: center; color: #333; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; color: #333; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    `;

    printWindow.document.body.innerHTML = `
      <h1>${title}</h1>
      <table>
        <thead>
          <tr>
            ${columns.map((c) => `<th>${c}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${columns.map((c) => `<td>${row[c] || ""}</td>`).join("")}
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    setTimeout(() => {
      printWindow.print();
    }, 100);
  }, []);

  return {
    gridRef,
    onExportExcel,
    onExportPdf,
    onPrint,
  };
}
