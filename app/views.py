import streamlit as st
from src.neo_risk_intelligence.visualization.plotly_solar import build_figure
from src.neo_risk_intelligence.visualization.plotly_earth import build_earth

def solar():
    st.title("Solar System")

    if st.button("Go to Earth"):
        st.session_state["page"] = "earth"

    st.plotly_chart(build_figure(), width="stretch")

def earth():
    st.title("Earth View")

    if st.button("Back"):
        st.session_state["page"] = "solar"

    st.plotly_chart(build_earth(), width="stretch")
