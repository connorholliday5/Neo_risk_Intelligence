import streamlit as st

def get_user_config():
    st.sidebar.header("Settings")

    lat = st.sidebar.number_input("Latitude", value=41.5, key="lat")
    lon = st.sidebar.number_input("Longitude", value=-71.4, key="lon")

    return {
        "lat": lat,
        "lon": lon
    }
