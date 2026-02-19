import * as XLSX from "xlsx";

const escapeCsvCell = (value) => {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const shuffleArray = (values) => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const buildDerangement = (size, forbiddenChildIndexes = []) => {
  const baseIndexes = Array.from({ length: size }, (_, index) => index);

  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const shuffled = shuffleArray(baseIndexes);
    const isValid = shuffled.every(
      (selectedChildIndex, employeeIndex) =>
        selectedChildIndex !== employeeIndex &&
        selectedChildIndex !== forbiddenChildIndexes[employeeIndex]
    );

    if (isValid) {
      return shuffled;
    }
  }

  throw new Error("Unable to generate valid Secret Santa assignments.");
};

const parseRows = async (file, label) => {
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

  return XLSX.utils.sheet_to_json(firstSheet, {
    defval: "",
    raw: false,
  });
};

const parseEmployees = async (employeeFile) => {
  const rows = await parseRows(employeeFile, "Employee file");

  const employees = rows.map((row) => ({
    name: String(row.Employee_Name ?? "").trim(),
    email: String(row.Employee_EmailID ?? "").trim(),
  }));

  if (employees.length < 2) {
    throw new Error("At least 2 employees are required for Secret Santa.");
  }

  const duplicateEmail = new Set();
  for (const employee of employees) {
    if (duplicateEmail.has(employee.email)) {
      throw new Error("Employee_EmailID values must be unique.");
    }
    duplicateEmail.add(employee.email);
  }

  return employees;
};

const buildPreviousConstraints = async (previousFile, employees) => {
  if (!previousFile) {
    return Array(employees.length).fill(undefined);
  }

  const rows = await parseRows(previousFile, "Previous assignments file");
  const employeeIndexByEmail = new Map(
    employees.map((employee, index) => [employee.email, index])
  );
  const forbiddenChildIndexes = Array(employees.length).fill(undefined);
  const seenGiverEmails = new Set();

  rows.forEach((row) => {
    const giverEmail = String(row.Employee_EmailID ?? "").trim();
    const childEmail = String(row.Secret_Child_EmailID ?? "").trim();

    if (!giverEmail || !childEmail) {
      return;
    }

    if (seenGiverEmails.has(giverEmail)) {
      throw new Error("Previous assignments contain duplicate Employee_EmailID rows.");
    }
    seenGiverEmails.add(giverEmail);

    const giverIndex = employeeIndexByEmail.get(giverEmail);
    const childIndex = employeeIndexByEmail.get(childEmail);

    if (giverIndex === undefined || childIndex === undefined) {
      return;
    }

    forbiddenChildIndexes[giverIndex] = childIndex;
  });

  return forbiddenChildIndexes;
};

export const buildSecretSantaCsv = async (employeeFile, previousFile) => {
  const employees = await parseEmployees(employeeFile);
  const forbiddenChildIndexes = await buildPreviousConstraints(
    previousFile,
    employees
  );
  const childIndexes = buildDerangement(employees.length, forbiddenChildIndexes);

  const lines = [
    [
      "Employee_Name",
      "Employee_EmailID",
      "Secret_Child_Name",
      "Secret_Child_EmailID",
    ].join(","),
  ];

  employees.forEach((employee, employeeIndex) => {
    const child = employees[childIndexes[employeeIndex]];
    lines.push(
      [employee.name, employee.email, child.name, child.email]
        .map(escapeCsvCell)
        .join(",")
    );
  });

  return lines.join("\n");
};
