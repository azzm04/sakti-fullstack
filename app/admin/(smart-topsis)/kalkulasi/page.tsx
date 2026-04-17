"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";

// 1. Define the strictly typed interface for your backend payload
interface RankingPayload {
  alternatives: string[];
  matrix: number[][];
  criteria_points: number[];
  criteria_types: string[];
}

interface RankedResult {
  rank: number;
  alternative: string;
  closeness_score: number;
}

// 2. The parser function we built earlier
const parseExcelToRankingPayload = (rawData: any[]): RankingPayload => {
  const alternatives: string[] = [];
  const matrix: number[][] = [];

  const parseNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    const cleanString = String(value).replace(/[^0-9]/g, "");
    const parsed = parseInt(cleanString, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  rawData.forEach((row) => {
    if (!row["Nama"]) return; 

    alternatives.push(String(row["Nama"]));

    const matrixRow = [
      parseNumber(row["Pekerjaan Bapak"]),
      parseNumber(row["Pekerjaan Ibu"]),
      parseNumber(row["Penghasilan Bapak"]),
      parseNumber(row["Penghasilan Ibu"]),
      parseNumber(row["Kepemilikan Rumah"]),
      parseNumber(row["Jumlah Tanggungan"]),
      parseNumber(row["Jumlah Orang dalam Satu Rumah"]),
      parseNumber(row["Luas Bangunan Rumah"]),
      parseNumber(row["Sumber Air Minum"]),
      parseNumber(row["Daya Listrik Rumah"]),
      parseNumber(row["MCK Rumah"])
    ];

    matrix.push(matrixRow);
  });

  return {
    alternatives,
    matrix,
    criteria_points: [50, 50, 40, 40, 30, 10, 10, 30, 10, 10, 10],
    criteria_types: ["cost", "cost", "cost", "cost", "cost", "benefit", "benefit", "cost", "cost", "cost", "cost"]
  };
};

export default function Home() {
  // State for both raw data and the final payload
  const [rawData, setRawData] = useState<any[] | null>(null);
  const [apiPayload, setApiPayload] = useState<RankingPayload | null>(null);
  
  const [fileName, setFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [results, setResults] = useState<RankedResult[] | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadStatus(null); // Reset status on new upload

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      // Save the raw Excel JSON
      setRawData(json);

      // Instantly parse and save the API payload
      const payload = parseExcelToRankingPayload(json);
      setApiPayload(payload);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSendToBackend = async () => {
    if (!apiPayload) return;

    setIsUploading(true);
    setUploadStatus("Sending data to API...");
    setResults(null); // Clear previous results if they click send again

    try {
      const response = await fetch("http://localhost:8000/api/rank", { // TODO change this to api backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload), 
      });

      if (!response.ok) {
        throw new Error("Failed to upload data");
      }

      // Capture the ranked array from the backend
      const resultData: RankedResult[] = await response.json(); 
      
      setResults(resultData);
      setUploadStatus("Success! Candidates ranked.");
      
    } catch (error) {
      console.error(error);
      setUploadStatus("Error sending data. Check the console.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">Excel to JSON Converter</h1>
      
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 max-w-2xl">
        <label className="block mb-2 font-medium text-gray-700">
          Upload an .xlsx or .csv file
        </label>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload} 
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {apiPayload && rawData && (
        <div className="flex flex-col gap-6">
          {/* Upload Controls */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <button 
              onClick={handleSendToBackend}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Processing..." : "Send Payload to API"}
            </button>
            {uploadStatus && (
              <span className={`font-medium ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {uploadStatus}
              </span>
            )}
          </div>

          {/* JSON Display Area - Side by Side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Raw Data */}
            <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col h-[600px]">
              <div className="bg-gray-800 px-4 py-3 text-gray-200 text-sm flex justify-between items-center border-b border-gray-700">
                <span className="font-semibold text-blue-400">Raw Excel JSON</span>
                <span className="text-gray-400 text-xs">{rawData.length} rows detected</span>
              </div>
              <div className="p-4 overflow-auto flex-1">
                <pre className="text-gray-300 text-xs font-mono">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Right Column: Formatted Payload */}
            <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col h-[600px]">
              <div className="bg-gray-800 px-4 py-3 text-gray-200 text-sm flex justify-between items-center border-b border-gray-700">
                <span className="font-semibold text-green-400">API Payload (Formatted)</span>
                <span className="text-gray-400 text-xs">{apiPayload.alternatives.length} valid alternatives</span>
              </div>
              <div className="p-4 overflow-auto flex-1">
                <pre className="text-green-400 text-xs font-mono">
                  {JSON.stringify(apiPayload, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        </div>
      )}

      {results && (
        <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-800">Final Ranking Results</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-4 w-24 text-center">Rank</th>
                  <th scope="col" className="px-6 py-4">Name (Alternative)</th>
                  <th scope="col" className="px-6 py-4 text-right">Closeness Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((item, index) => (
                  <tr 
                    key={item.alternative} 
                    className={index === 0 ? "bg-blue-50/50" : "hover:bg-gray-50 transition-colors"}
                  >
                    <td className="px-6 py-4 text-center font-bold text-gray-900 text-base">
                      {item.rank === 1 ? "🥇 1" : item.rank === 2 ? "🥈 2" : item.rank === 3 ? "🥉 3" : item.rank}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.alternative}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-blue-600 font-medium">
                      {/* Format the long float to 4 decimal places for cleaner UI */}
                      {item.closeness_score.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}