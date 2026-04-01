import streamlit as st
import datetime
import pandas as pd
from neo_risk.db import get_connection


def global_header():
    now = datetime.datetime.now()
    st.sidebar.write(f"Date: {now.date()}")
    st.sidebar.write(f"Time: {now.strftime('%H:%M:%S')}")


def page_solar_system():
    st.header("Solar System View")
    st.write("Visuals and metrics coming soon.")


def page_neo_risk():
    st.header("Earth + NEO Risk Intelligence")
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM neo_features", conn)
    st.write(f"Total NEOs analyzed: {len(df)}")
    st.dataframe(df.head(10))

    anomalies = pd.read_sql_query("SELECT * FROM neo_anomalies", conn)
    if not anomalies.empty:
        st.write("Detected Anomalies:")
        st.dataframe(anomalies)


def page_local_sky():
    st.header("Local Sky")
    st.write("Upcoming astronomy events will appear here.")


def main():
    st.title("NEO Risk Intelligence Dashboard")
    global_header()

    page = st.sidebar.selectbox(
        "Select Page", ["Solar System", "NEO Risk", "Local Sky"]
    )

    if page == "Solar System":
        page_solar_system()
    elif page == "NEO Risk":
        page_neo_risk()
    elif page == "Local Sky":
        page_local_sky()


if __name__ == "__main__":
    main()
