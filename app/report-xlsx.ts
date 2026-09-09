export type HiringVehicleRegisterRow = {
  invoiceNo: string;
  date: Date | null;
  returnDate: Date | null;
  timeOut: string;
  timeIn: string;
  from: string;
  to: string;
  vehicleNo: string;
  vehicleType: string;
  purpose: string;
  budgetCode: string;
  totalKm: number;
  totalAmount: number;
  passengers: string;
  remarks: string;
  paymentUpdates: string;
};

type RegisterOptions = {
  title: string;
  periodLabel: string;
  rows: HiringVehicleRegisterRow[];
};

const encoder = new TextEncoder();
const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const columnName = (column: number) => {
  let name = "";
  for (let value = column; value > 0; value = Math.floor((value - 1) / 26)) name = String.fromCharCode(((value - 1) % 26) + 65) + name;
  return name;
};
const excelDate = (value: Date) => Math.floor((Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);
const inlineCell = (ref: string, value: string, style = 5) => `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
const numberCell = (ref: string, value: number, style = 6) => `<c r="${ref}" s="${style}" t="n"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
const dateCell = (ref: string, value: Date | null) => value ? numberCell(ref, excelDate(value), 8) : inlineCell(ref, "", 4);
const formulaCell = (ref: string, formula: string, cached: number, style = 6) => `<c r="${ref}" s="${style}"><f>${xml(formula)}</f><v>${cached}</v></c>`;

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();
const crc32 = (bytes: Uint8Array) => {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};
const joinBytes = (parts: Uint8Array[]) => {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
};
const zipStored = (files: Array<{ name: string; content: string }>) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const checksum = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); localView.setUint16(4, 20, true); localView.setUint16(6, 0, true); localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true); localView.setUint16(12, dosDate, true); localView.setUint32(14, checksum, true); localView.setUint32(18, data.length, true); localView.setUint32(22, data.length, true); localView.setUint16(26, name.length, true); localView.setUint16(28, 0, true); local.set(name, 30);
    localParts.push(local, data);
    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, 0, true); centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true); centralView.setUint16(14, dosDate, true); centralView.setUint32(16, checksum, true); centralView.setUint32(20, data.length, true); centralView.setUint32(24, data.length, true); centralView.setUint16(28, name.length, true); centralView.setUint16(30, 0, true); centralView.setUint16(32, 0, true); centralView.setUint16(34, 0, true); centralView.setUint16(36, 0, true); centralView.setUint32(38, 0, true); centralView.setUint32(42, offset, true); central.set(name, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralDirectory = joinBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(4, 0, true); endView.setUint16(6, 0, true); endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true); endView.setUint32(12, centralDirectory.length, true); endView.setUint32(16, offset, true); endView.setUint16(20, 0, true);
  return joinBytes([...localParts, centralDirectory, end]);
};

const buildSheet = ({ title, periodLabel, rows }: RegisterOptions) => {
  const headers = ["Invoice No", "Date", "Return Date", "Time Out", "Time In", "From", "To", "Vehicle No.", "Type of Vehicle", "Purpose", "Budget Code", "Total KMs", "Total Amount (LKR)", "Passengers", "Remarks", "Payment Updates"];
  const body = rows.map((row, index) => {
    const rowNumber = index + 4;
    const values = [
      inlineCell(`A${rowNumber}`, row.invoiceNo, 4), dateCell(`B${rowNumber}`, row.date), dateCell(`C${rowNumber}`, row.returnDate), inlineCell(`D${rowNumber}`, row.timeOut, 4), inlineCell(`E${rowNumber}`, row.timeIn, 4),
      inlineCell(`F${rowNumber}`, row.from), inlineCell(`G${rowNumber}`, row.to), inlineCell(`H${rowNumber}`, row.vehicleNo, 4), inlineCell(`I${rowNumber}`, row.vehicleType, 4), inlineCell(`J${rowNumber}`, row.purpose),
      inlineCell(`K${rowNumber}`, row.budgetCode), numberCell(`L${rowNumber}`, row.totalKm), numberCell(`M${rowNumber}`, row.totalAmount, 7), inlineCell(`N${rowNumber}`, row.passengers), inlineCell(`O${rowNumber}`, row.remarks), inlineCell(`P${rowNumber}`, row.paymentUpdates),
    ];
    return `<row r="${rowNumber}" ht="28" customHeight="1">${values.join("")}</row>`;
  }).join("");
  const firstDataRow = 4;
  const lastDataRow = Math.max(firstDataRow, rows.length + 3);
  const summaryRow = lastDataRow + 2;
  const totalKm = rows.reduce((total, row) => total + row.totalKm, 0);
  const totalAmount = rows.reduce((total, row) => total + row.totalAmount, 0);
  const rate = totalKm ? totalAmount / totalKm : 0;
  const summary = [
    `<row r="${summaryRow}" ht="24" customHeight="1">${inlineCell(`A${summaryRow}`, "Summary", 9)}${formulaCell(`L${summaryRow}`, `SUM(L${firstDataRow}:L${lastDataRow})`, totalKm, 9)}${formulaCell(`M${summaryRow}`, `SUM(M${firstDataRow}:M${lastDataRow})`, totalAmount, 10)}</row>`,
    `<row r="${summaryRow + 1}">${inlineCell(`L${summaryRow + 1}`, "Rs/KM", 9)}${formulaCell(`M${summaryRow + 1}`, `IFERROR(M${summaryRow}/L${summaryRow},0)`, rate, 10)}</row>`,
    `<row r="${summaryRow + 3}">${inlineCell(`A${summaryRow + 3}`, `Period: ${periodLabel}`, 9)}</row>`,
    `<row r="${summaryRow + 5}">${inlineCell(`A${summaryRow + 5}`, `Total KM Covered: ${totalKm.toLocaleString("en-US")} KM`, 9)}</row>`,
    `<row r="${summaryRow + 7}">${inlineCell(`A${summaryRow + 7}`, "Total Amount:", 9)}${numberCell(`B${summaryRow + 7}`, totalAmount, 10)}${inlineCell(`D${summaryRow + 7}`, "LKR", 9)}</row>`,
    `<row r="${summaryRow + 9}">${inlineCell(`A${summaryRow + 9}`, `Entries: ${rows.length} trip${rows.length === 1 ? "" : "s"}`, 9)}</row>`,
    `<row r="${summaryRow + 11}">${inlineCell(`A${summaryRow + 11}`, `Rs per KM: ${rate.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`, 9)}</row>`,
  ].join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:P${summaryRow + 11}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="3" width="14" customWidth="1"/><col min="4" max="5" width="12" customWidth="1"/><col min="6" max="6" width="16" customWidth="1"/><col min="7" max="7" width="24" customWidth="1"/><col min="8" max="9" width="16" customWidth="1"/><col min="10" max="10" width="38" customWidth="1"/><col min="11" max="11" width="21" customWidth="1"/><col min="12" max="13" width="16" customWidth="1"/><col min="14" max="15" width="22" customWidth="1"/><col min="16" max="16" width="32" customWidth="1"/></cols><sheetData><row r="1" ht="28" customHeight="1">${inlineCell("A1", "CHRYSALIS", 1)}</row><row r="2" ht="26" customHeight="1">${inlineCell("A2", title, 2)}</row><row r="3" ht="34" customHeight="1">${headers.map((header, index) => inlineCell(`${columnName(index + 1)}3`, header, 3)).join("")}</row>${body}${summary}</sheetData><autoFilter ref="A3:P${lastDataRow}"/><mergeCells count="2"><mergeCell ref="A1:P1"/><mergeCell ref="A2:P2"/></mergeCells><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0" paperSize="9"/></worksheet>`;
};

export const buildHiringVehicleRegisterXlsx = (options: RegisterOptions) => {
  const sheet = buildSheet(options);
  const files = [
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>` },
    { name: "docProps/core.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(options.title)}</dc:title><dc:creator>Chrysalis Mobility Operations</dc:creator><cp:lastModifiedBy>Chrysalis Mobility Operations</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>` },
    { name: "docProps/app.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Chrysalis Mobility Operations</Application></Properties>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr date1904="0"/><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Full Summary" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "xl/styles.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts><fonts count="4"><font><sz val="10"/><name val="Arial"/><color rgb="FF1F2937"/></font><font><b/><sz val="16"/><name val="Arial"/><color rgb="FFF23D61"/></font><font><b/><sz val="12"/><name val="Arial"/><color rgb="FF0B2748"/></font><font><b/><sz val="10"/><name val="Arial"/><color rgb="FFFFFFFF"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F6CBD"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD6DCE5"/></left><right style="thin"><color rgb="FFD6DCE5"/></right><top style="thin"><color rgb="FFD6DCE5"/></top><bottom style="thin"><color rgb="FFD6DCE5"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="11"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/><xf numFmtId="165" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
    { name: "xl/worksheets/sheet1.xml", content: sheet },
  ];
  return zipStored(files);
};

export const downloadHiringVehicleRegister = (filename: string, options: RegisterOptions) => {
  const bytes = buildHiringVehicleRegisterXlsx(options);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
