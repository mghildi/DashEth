from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {"message": "FastAPI is live!"}

@app.get("/inventory-ratio")
def get_inventory_ratio():
    sheet_id = "1j_nM9gdqaVIeuZFT9MoFHZdhDSWw5guwrlwb14ig-k0"
    sheet_name = "Sheet1"
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"

    df = pd.read_csv(url)
    df['Date'] = pd.to_datetime(df['Date'])
    df['Day'] = df['Date'].dt.day
    df['Month'] = df['Date'].dt.month
    df['Year'] = df['Date'].dt.year

    today = datetime.today()
    current_day = today.day
    current_month = today.month
    previous_month = current_month - 1 if current_month > 1 else 12
    year_prev = today.year if current_month > 1 else today.year - 1

    cm_filter = (df['Month'] == current_month) & (df['Year'] == today.year) & (df['Day'] <= current_day)
    pm_filter = (df['Month'] == previous_month) & (df['Year'] == year_prev) & (df['Day'] <= current_day)

    current_sum = df.loc[cm_filter, 'Inventory_Received'].sum()
    previous_sum = df.loc[pm_filter, 'Inventory_Received'].sum()

    def safe_ratio(n, d): return round(n / d, 2) if d else 0

    data = {
        "ratio": safe_ratio(current_sum, previous_sum),
        "current_sum": int(current_sum),
        "previous_sum": int(previous_sum),
        "dials_per_coa_cm": safe_ratio(df.loc[cm_filter, 'Voice_Bot_Dials'].sum(), df.loc[cm_filter, 'COA'].sum()),
        "dials_per_coa_lm": safe_ratio(df.loc[pm_filter, 'Voice_Bot_Dials'].sum(), df.loc[pm_filter, 'COA'].sum()),
        "connects_per_dials_cm": safe_ratio(df.loc[cm_filter, 'Voice_Bot_Connects'].sum(), df.loc[cm_filter, 'Voice_Bot_Dials'].sum()),
        "connects_per_dials_lm": safe_ratio(df.loc[pm_filter, 'Voice_Bot_Connects'].sum(), df.loc[pm_filter, 'Voice_Bot_Dials'].sum()),
        "ptp_per_connect_cm": safe_ratio(df.loc[cm_filter, 'Voice_Bot_PTP'].sum(), df.loc[cm_filter, 'Voice_Bot_Connects'].sum()),
        "ptp_per_connect_lm": safe_ratio(df.loc[pm_filter, 'Voice_Bot_PTP'].sum(), df.loc[pm_filter, 'Voice_Bot_Connects'].sum()),
        "sms_per_coa_cm": safe_ratio(df.loc[cm_filter, 'SMS'].sum(), df.loc[cm_filter, 'COA'].sum()),
        "sms_per_coa_lm": safe_ratio(df.loc[pm_filter, 'SMS'].sum(), df.loc[pm_filter, 'COA'].sum()),
        "ivr_per_coa_cm": safe_ratio(df.loc[cm_filter, 'IVR_Dials'].sum(), df.loc[cm_filter, 'COA'].sum()),
        "ivr_per_coa_lm": safe_ratio(df.loc[pm_filter, 'IVR_Dials'].sum(), df.loc[pm_filter, 'COA'].sum()),
        "payments_cm": round(df.loc[cm_filter, 'Payments'].sum() / 100000.0, 0),
        "payments_lm": round(df.loc[pm_filter, 'Payments'].sum() / 100000.0, 0),
    }
    return data
