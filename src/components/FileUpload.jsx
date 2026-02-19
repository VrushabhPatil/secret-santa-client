import axios from "axios";
import { useState } from "react";
import {
  normalizeFileToCsv,
  validateEmployeeSheet,
} from "../utils/validateSpreadsheet";

function FileUpload() {
  const [employeeFile, setEmployeeFile] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseBlobErrorMessage = async (err) => {
    const defaultMessage = "Unable to generate Secret Santa file.";

    if (!err?.response?.data) {
      return err?.message || defaultMessage;
    }

    const data = err.response.data;
    if (typeof data === "string") {
      return data;
    }

    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const parsed = JSON.parse(text);
        return parsed?.message || text || defaultMessage;
      } catch {
        return defaultMessage;
      }
    }

    return defaultMessage;
  };

  const handleSubmit = async () => {
    setError("");

    if (!employeeFile) {
      setError("Please upload the employee list file.");
      return;
    }

    let normalizedEmployees;

    try {
      await validateEmployeeSheet(employeeFile);
      normalizedEmployees = await normalizeFileToCsv(
        employeeFile,
        "employees.csv"
      );
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    const formData = new FormData();
    formData.append("employees", normalizedEmployees);

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        "https://secret-santa-server.onrender.com/api/santa",
        formData,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "secret-santa.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = await parseBlobErrorMessage(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p>Upload Employee List only (.csv, .xlsx, .xls)</p>
      <input
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={(e) => setEmployeeFile(e.target.files[0])}
      />
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Generating..." : "Generate"}
      </button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}

export default FileUpload;
