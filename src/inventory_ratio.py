from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
app = FastAPI() 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002"],
  # You can replace "*" with ["http://localhost:3002"] for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import pandas as pd
from datetime import datetime

app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.get("/inventory-ratio")
def get_inventory_ratio():

    sheet_id = "1j_nM9gdqaVIeuZFT9MoFHZdhDSWw5guwrlwb14ig-k0"
    sheet_name = "Sheet1"  # or your tab name
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"

    df = pd.read_csv(url)

    df['Date'] = pd.to_datetime(df['Date'])
    df['Day'] = df['Date'].dt.day
    df['Month'] = df['Date'].dt.month
    df['Year'] = df['Date'].dt.year

    # Get today's date
    today = datetime.today()
    current_day = today.day
    current_month = today.month
    previous_month = (today.month - 1) if today.month > 1 else 12
    year_of_previous_month = today.year if today.month > 1 else today.year - 1

    # Filter rows for current and previous month up to the same day
    current_month_filter = (
        (df['Month'] == current_month) &
        (df['Year'] == today.year) &
        (df['Day'] <= current_day)
    )

    previous_month_filter = (
        (df['Month'] == previous_month) &
        (df['Year'] == year_of_previous_month) &
        (df['Day'] <= current_day)
    )

    current_sum = df.loc[current_month_filter, 'Inventory_Received'].sum()
    previous_sum = df.loc[previous_month_filter, 'Inventory_Received'].sum()

    # Avoid divide-by-zero, calculate CM and LM ratios
    def safe_ratio(numerator, denominator):
        return round(numerator / denominator, 2) if denominator else 0

    voice_dials_cm = df.loc[current_month_filter, 'Voice_Bot_Dials'].sum()
    coa_cm = df.loc[current_month_filter, 'COA'].sum()
    voice_connects_cm = df.loc[current_month_filter, 'Voice_Bot_Connects'].sum()
    voice_ptp_cm = df.loc[current_month_filter, 'Voice_Bot_PTP'].sum()
    sms_sent_cm = df.loc[current_month_filter, 'SMS'].sum()
    ivr_dials_cm = df.loc[current_month_filter, 'IVR_Dials'].sum()
    payments_cm = df.loc[current_month_filter, 'Payments'].sum()
    
    

    voice_dials_lm = df.loc[previous_month_filter, 'Voice_Bot_Dials'].sum()
    coa_lm = df.loc[previous_month_filter, 'COA'].sum()
    voice_connects_lm = df.loc[previous_month_filter, 'Voice_Bot_Connects'].sum()
    voice_ptp_lm = df.loc[previous_month_filter, 'Voice_Bot_PTP'].sum()
    sms_sent_lm = df.loc[previous_month_filter, 'SMS'].sum()
    ivr_dials_lm = df.loc[previous_month_filter, 'IVR_Dials'].sum()
    payments_lm = df.loc[previous_month_filter, 'Payments'].sum()

    dials_per_coa_cm = safe_ratio(voice_dials_cm, coa_cm)
    dials_per_coa_lm = safe_ratio(voice_dials_lm, coa_lm)
    connects_per_dials_cm = safe_ratio(voice_connects_cm, voice_dials_cm)
    connects_per_dials_lm = safe_ratio(voice_connects_lm, voice_dials_lm)
    ptp_per_connect_cm = safe_ratio(voice_ptp_cm , voice_connects_cm)
    ptp_per_connect_lm = safe_ratio(voice_ptp_lm , voice_connects_lm)
    sms_per_coa_cm = safe_ratio(sms_sent_cm, coa_cm)
    sms_per_coa_lm = safe_ratio(sms_sent_lm, coa_lm)
    ivr_per_coa_cm = safe_ratio(ivr_dials_cm, coa_cm)
    ivr_per_coa_lm = safe_ratio(ivr_dials_lm, coa_lm)

    print(df.columns)
    print(current_sum)
    print(connects_per_dials_cm, connects_per_dials_lm)
    ratio = current_sum / previous_sum if previous_sum > 0 else 0
    return {
        "ratio": ratio,
        "current_sum": int(current_sum),
        "previous_sum": int(previous_sum),
        "dials_per_coa_cm": dials_per_coa_cm,
        "dials_per_coa_lm": dials_per_coa_lm,
        "connects_per_dials_cm": connects_per_dials_cm,
        "connects_per_dials_lm": connects_per_dials_lm,
        "ptp_per_connect_cm": ptp_per_connect_cm,
        "ptp_per_connect_lm": ptp_per_connect_lm,
        "sms_per_coa_cm": sms_per_coa_cm,
        "sms_per_coa_lm": sms_per_coa_lm,
        "ivr_per_coa_cm": ivr_per_coa_cm,
        "ivr_per_coa_lm": ivr_per_coa_lm,
        "payments_cm": round(payments_cm / 100000.0, 1),
        "payments_lm": round(payments_lm / 100000.0, 1)

        
}