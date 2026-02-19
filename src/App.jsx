import { useState } from "react";
import {
  validateEmployeeSheet,
  validatePreviousSheet,
} from "./utils/validateSpreadsheet";
import { buildSecretSantaCsv } from "./utils/secretSanta";

function App() {
  const [employees, setEmployees] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!employees) {
      setError("Please upload the employee list file.");
      return;
    }

    try {
      setIsSubmitting(true);
      await validateEmployeeSheet(employees);
      if (previous) {
        await validatePreviousSheet(previous);
      }

      const csvContent = await buildSecretSantaCsv(employees, previous);
      const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "secret-santa.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || "Unable to generate Secret Santa file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Secret Santa Generator</h1>

      <p>Upload Employee List (.csv, .xlsx, .xls)</p>

      <input
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={(e) => setEmployees(e.target.files[0])}
      />
      <br /><br />

      <p>Upload Previous Assignments (optional)</p>

      <input
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={(e) => setPrevious(e.target.files[0])}
      />
      <br /><br />

      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Generating..." : "Generate"}
      </button>

      {error && (
        <p style={{ color: "crimson", marginTop: "12px" }}>{error}</p>
      )}
    </div>
  );
}

export default App;
