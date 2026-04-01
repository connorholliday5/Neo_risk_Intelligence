import streamlit as st
import sys, os

sys.path.append(os.path.abspath("app"))

import views

st.set_page_config(layout="wide")

if "page" not in st.session_state:
    st.session_state["page"] = "solar"

if st.session_state["page"] == "solar":
    views.solar()
elif st.session_state["page"] == "earth":
    views.earth()
