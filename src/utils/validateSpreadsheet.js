import * as XLSX from "xlsx";

const EMPLOYEE_HEADERS = ["Employee_Name", "Employee_EmailID"];
const PREVIOUS_HEADERS = [
  "Employee_Name",
  "Employee_EmailID",
  "Secret_Child_Name",
  "Secret_Child_EmailID",
];
const SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const normalizeHeader = (value) => String(value ?? "").trim();

const ensureSupportedFile = (file, label) => {
  const fileName = String(file?.name ?? "").toLowerCase();
  const isSupported = SUPPORTED_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );

  if (!isSupported) {
    throw new Error(`${label} must be a CSV or Excel file (.csv, .xlsx, .xls).`);
  }
};

const readCsvData = async (file, label) => {
  ensureSupportedFile(file, label);
  const fileName = String(file?.name ?? "").toLowerCase();
  const isCsv = fileName.endsWith(".csv");

  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheet) {
    throw new Error(`${label} is unreadable.`);
  }

  const matrix = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (matrix.length === 0) {
    throw new Error(`${label} has no rows.`);
  }

  const headers = (matrix[0] || []).map(normalizeHeader);
  const rows = matrix
    .slice(1)
    .filter((row) => row.some((value) => String(value ?? "").trim().length > 0));

  return { headers, rows };
};

const ensureHeaders = (headers, requiredHeaders, label) => {
  const missingHeaders = requiredHeaders.filter(
    (requiredHeader) => !headers.includes(requiredHeader)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `${label} is missing required columns: ${missingHeaders.join(", ")}`
    );
  }
};

const ensureRows = (rows, headers, requiredHeaders, label) => {
  if (rows.length === 0) {
    throw new Error(`${label} has no data rows.`);
  }

  const headerIndexes = requiredHeaders.map((header) => headers.indexOf(header));
  const invalidRowIndexes = [];

  rows.forEach((row, index) => {
    const hasMissingRequiredValue = headerIndexes.some((columnIndex) => {
      const value = String(row[columnIndex] ?? "").trim();
      return value.length === 0;
    });

    if (hasMissingRequiredValue) {
      invalidRowIndexes.push(index + 2);
    }
  });

  if (invalidRowIndexes.length > 0) {
    throw new Error(
      `${label} has empty required values in row(s): ${invalidRowIndexes.join(
        ", "
      )}`
    );
  }
};

export const validateEmployeeSheet = async (file) => {
  const { headers, rows } = await readCsvData(file, "Employee file");
  ensureHeaders(headers, EMPLOYEE_HEADERS, "Employee file");
  ensureRows(rows, headers, EMPLOYEE_HEADERS, "Employee file");
};

export const validatePreviousSheet = async (file) => {
  const { headers, rows } = await readCsvData(
    file,
    "Previous assignments file"
  );
  ensureHeaders(headers, PREVIOUS_HEADERS, "Previous assignments file");
  ensureRows(rows, headers, PREVIOUS_HEADERS, "Previous assignments file");
};

export const normalizeFileToCsv = async (file, outputName = "data.csv") => {
  ensureSupportedFile(file, "Uploaded file");
  const fileName = String(file?.name ?? "").toLowerCase();

  if (fileName.endsWith(".csv")) {
    return file;
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheet) {
    throw new Error("Uploaded file is unreadable.");
  }

  const csvContent = XLSX.utils.sheet_to_csv(firstSheet, {
    blankrows: false,
  });

  if (!csvContent.trim()) {
    throw new Error("Uploaded file is empty.");
  }

  return new File([csvContent], outputName, { type: "text/csv" });
};
