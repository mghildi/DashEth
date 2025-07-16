import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1j_nM9gdqaVIeuZFT9MoFHZdhDSWw5guwrlwb14ig-k0/gviz/tq?tqx=out:csv&sheet=Sheet1';


const parseCSV = (text) => {
  const [headerLine, ...lines] = text.trim().split('\n');
  
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => {
      row[h] = isNaN(values[i]) ? values[i] : Number(values[i]);
    });
    return row;
  });
};

const getStatusColor = (value, avg) => {
  const ratio = value / avg;
  if (ratio > 1.5) return 'bg-green-500';
  if (ratio < 1) return 'bg-red-500';
  return 'bg-gray-200';
};
const getInventoryColor = (ratio) => {
  if (ratio == null) return "bg-gray-300";
  if (ratio < 0.9) return "bg-red-500";
  if (ratio < 1.1) return "bg-yellow-400";
  return "bg-green-500";
};

const getDialsColor = (ratio) => {
  if (ratio == null) return "bg-gray-300";
  if (ratio < 0.9) return "bg-red-500";
  if (ratio < 1.1) return "bg-yellow-400";
  return "bg-green-500";
};

const getConnectColor = (ratio) => {
  if (ratio == null) return "bg-gray-300";
  if (ratio < 0.9) return "bg-red-500";
  if (ratio < 1.1) return "bg-yellow-400";
  return "bg-green-500";
};

const getPtpColor = (ratio) => {
  if (ratio == null) return "bg-gray-300";
  if (ratio < 0.9) return "bg-red-500";
  if (ratio < 1.1) return "bg-yellow-400";
  return "bg-green-500";
};

const getSmsColor = (ratio) => {
  if (ratio == null) return "bg-gray-300";
  if (ratio < 0.9) return "bg-red-500";
  if (ratio < 1.1) return "bg-yellow-400";
  return "bg-green-500";
};

const getIvrColor = (ratio) => {
  if (ratio == null) return "bg-gray-300";
  if (ratio < 0.9) return "bg-red-500";
  if (ratio < 1.1) return "bg-yellow-400";
  return "bg-green-500";
};
const getPaymentColor = (ratio) => {
  if (ratio == null) return "bg-gray-300";
  if (ratio < 0.9) return "bg-red-500";
  if (ratio < 1.1) return "bg-yellow-400";
  return "bg-green-500";
};


export default function Dashboard() {
  const [inventoryMoMRatio, setInventoryMoMRatio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csvLoading, setCsvLoading] = useState(true);

  const [selectedMetric, setSelectedMetric] = useState(null);
  const [inventorySums, setInventorySums] = useState({ current: 0, previous: 0 });
  const [currentMonthData, setCurrentMonthData] = useState([]);
  const [previousMonthData, setPreviousMonthData] = useState([]);
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [voiceDialsCOA, setVoiceDialsCOA] = useState({ current: 0, previous: 0 });
  const [voiceConnectsDial, setVoiceConnectsDial] = useState({ current: 0, previous: 0 });
  const [ptpRatio, setPtpRatio] = useState({ current: 0, previous: 0 });
  const [smsRatio, setSmsRatio] = useState({ current: 0, previous: 0 });
  const [ivrDials, setIvrDials] = useState({ current: 0, previous: 0 });
  const[payments, setPayments] = useState({ current: 0, previous: 0 });
  const displayNames = {
    Inventory_Received: "Inventory Received",
    Voice_Bot_Dials: "Bot Dials per COA",
    Voice_Bot_Connects: "Bot Connects per Dial",
    Voice_Bot_PTP: "PTP per Connect",
    Payments: "Bill(Lakh)",
    SMS: "SMS_Sent_per_COA",
    IVR_Dials: "IVR_Dials_per_COA"
    
  };
  

  useEffect(() => {
    fetch("https://fastapi-dashboard-51sz.onrender.com/inventory-ratio")

      .then(res => res.json())
      .then(data => {
        console.log("Bill from API:", data.payments_cm, typeof data.payments_cm);

        setInventoryMoMRatio(data.ratio);
        setInventorySums({
          current: Number(data.current_sum),
          previous: Number(data.previous_sum)
      
        });
        setVoiceDialsCOA({
          current: data.dials_per_coa_cm,
          previous: data.dials_per_coa_lm
        });
        setVoiceConnectsDial({
          current: data.connects_per_dials_cm,
          previous: data.connects_per_dials_lm
        });
        setSmsRatio({
          current: data.sms_per_coa_cm,
          previous: data.sms_per_coa_lm
        });
        
        setIvrDials({
          current: data.ivr_per_coa_cm,
          previous: data.ivr_per_coa_lm
        });

        setPayments({
          current: data.payments_cm,
          previous: data.payments_lm
        });
        setPtpRatio({
          current: data.ptp_per_connect_cm,
          previous: data.ptp_per_connect_lm
        });

        setLoading(false); // ✅ Only here after successful fetch
      })
      .catch(err => {
        console.error("Error fetching inventory ratio:", err);
        setLoading(false); // ✅ Also here in case of error
      });
  }, []);

 

  useEffect(() => {
    fetch(SHEET_CSV_URL)
      .then(res => res.text())
      .then(text => {
        const parsed = parseCSV(text);
        const parsedMetrics = Object.keys(parsed[0]).filter(k => k !== 'Date' && k.trim() !== '');
        setMetrics(parsedMetrics);
        


        const currentMonth = new Date().getMonth();
        const current = [];
        const previous = [];

        parsed.forEach(row => {
          const date = new Date(row.Date);
          const day = date.getDate();

          const point = { day };
          parsedMetrics.forEach(metric => {
            point[metric] = row[metric];
          });

          if (date.getMonth() === currentMonth) {
            current.push(point);
          } else if (date.getMonth() === currentMonth - 1 || (currentMonth === 0 && date.getMonth() === 11)) {
            previous.push(point);
          }
        });

        setData(parsed);
        setCurrentMonthData(current);
        setPreviousMonthData(previous);
        setMetrics(Object.keys(parsed[0]).filter(k => k !== 'Date' && k.trim() !== ''));
        setCsvLoading(false); // ✅ end loading
      })
      .catch(err => {
        console.error("Error fetching CSV:", err);
        setCsvLoading(false); // ✅ still end loading on failure
      });
  }, []);
  

  const getAvg = (key) => {
    const values = data.map(d => d[key]);
    return values.reduce((a, b) => a + b, 0) / values.length;
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl font-semibold">
        Refreshing Ethera Dashboard...
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1a1a] to-black p-6 space-y-6">
      <h1 className="text-2xl text-black font-bold p-4 rounded bg-gray-200">Ethera Control Center - SBI Voice Bot</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.filter(metric => metric !== 'COA').map((metric) => {
          const today = data[data.length - 1];
          const avg = getAvg(metric);
          const color = 
            metric === "Inventory_Received"
              ? getInventoryColor(inventoryMoMRatio)
              : metric === "Voice_Bot_Dials"  
              ? getDialsColor(voiceDialsCOA.current / voiceDialsCOA.previous)
              : metric === "Payments"
              ? getPaymentColor(payments.current / payments.previous)
              
              : metric === "Voice_Bot_Connects"
              
              
              ? getConnectColor(voiceConnectsDial.current / voiceConnectsDial.previous)
              : metric === "Voice_Bot_PTP"
              ? getPtpColor(ptpRatio.current / ptpRatio.previous)
              : metric === "SMS"
              ? getSmsColor(smsRatio.current / smsRatio.previous)
              : metric === "IVR_Dials"
              ? getIvrColor(ivrDials.current / ivrDials.previous)
              // ? getConnectColor(0.6)
              : getStatusColor(today[metric], avg);
         

          return (
            <div
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`p-4 rounded shadow cursor-pointer transform 
              hover:scale-105 
              active:scale-95 
              transition duration-150 ease-in-out ${color}`}
            >
              <h2 className="text-sm font-semibold">{displayNames[metric] || metric}</h2>

              {metric === 'Inventory_Received' ? (
                <p className="text-sm font-bold mt-2">
                  CM: {inventorySums.current.toLocaleString()} | LM: {inventorySums.previous.toLocaleString()}
                </p>
              ) : metric === 'Voice_Bot_Dials' ? (
               
                <p className="text-sm font-bold mt-2">
                  
                    
                  CM: {voiceDialsCOA.current} | LM: {voiceDialsCOA.previous}
                </p>    
                  
                ) : metric === 'Voice_Bot_Connects' ? (

                  <p className="text-sm font-bold mt-2">
                      CM: {voiceConnectsDial.current} | LM: {voiceConnectsDial.previous}
                  </p>
                ) : metric === 'Payments' ? (
                <p className="text-sm font-bold mt-2">
                  CM: {typeof payments.current == 'number' ? payments.current.toFixed(2) : "N/A"} | LM: {typeof payments.previous == 'number' ? payments.previous.toFixed(2) : "N/A"}
                </p>  

                  ) : metric === 'SMS' ? (
                <p className="text-sm font-bold mt-2">
                        CM: {typeof smsRatio.current == 'number' ? smsRatio.current.toFixed(2) : "N/A"} | LM: {typeof smsRatio.previous == 'number' ? smsRatio.previous.toFixed(2) : "N/A"}
                </p>
                  ) : metric === 'IVR_Dials' ? (
                <p className="text-sm font-bold mt-2">
                  CM: {ivrDials.current} | LM: {ivrDials.previous}
                </p>
                  ) :
                  
                  metric ===  'Voice_Bot_PTP' ? (
                <p className="text-sm font-bold mt-2">
                  CM: {typeof ptpRatio.current == 'number' ? ptpRatio.current.toFixed(2) : "N/A"} | LM: {typeof ptpRatio.previous == 'number' ? ptpRatio.previous.toFixed(2) : "N/A"}
                </p>
                  
                  ) 
                  :
                  (  
                <p className="text-lg font-bold">
                  {metric === 'Payments'
                    ? `₹${(today[metric] / 100000).toFixed(2) ?? "N/A"} Lac`
                    : today[metric].toLocaleString()}
                </p>
              
              )}


            </div>

          );
        })}
      </div>

      {selectedMetric && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">{selectedMetric} Trend</h3>

          {/** MERGE CURRENT AND PREVIOUS MONTH DATA BY DAY */}
          {(() => {
            const mergedData = [];

            for (let day = 1; day <= 31; day++) {
              const current = currentMonthData.find(d => d.day === day);
              const previous = previousMonthData.find(d => d.day === day);

              mergedData.push({
                day,
                current: current?.[selectedMetric] ?? null,
                previous: previous?.[selectedMetric] ?? null,
              });
            }

            return (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mergedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="previous" stroke="#999" strokeWidth={3} name="Previous Month" />
                  <Line type="monotone" dataKey="current" stroke="#8884d8" strokeWidth={3} name="Current Month" />
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      )}

  
    </div> 
  );
}     