import tkinter as tk
from infi.systray import SysTrayIcon
from neo_risk.db import get_connection
import time
import threading


def on_quit_callback(sys_tray_icon):
    print("Wallpaper app exiting")
    root.quit()


def fetch_neo_summary():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), MAX(risk_score) FROM neo_features")
    count, max_risk = cursor.fetchone()
    conn.close()
    return count, max_risk


def update_metrics(label):
    while True:
        count, max_risk = fetch_neo_summary()
        label.config(text=f"NEOs: {count}, Max Risk: {max_risk}")
        time.sleep(60)


def run_wallpaper_display():
    global root
    root = tk.Tk()
    root.overrideredirect(True)
    root.attributes("-topmost", True)
    root.geometry("{0}x{1}+0+0".format(root.winfo_screenwidth(), root.winfo_screenheight()))

    count, max_risk = fetch_neo_summary()
    label = tk.Label(root, text=f"NEOs: {count}, Max Risk: {max_risk}", font=("Helvetica", 20))
    label.pack(expand=True)

    threading.Thread(target=update_metrics, args=(label,), daemon=True).start()

    menu_options = (("Open", None, lambda x: print("Open clicked")),)
    systray = SysTrayIcon(None, "Wallpaper App", menu_options, on_quit=on_quit_callback)
    systray.start()

    root.mainloop()


if __name__ == "__main__":
    run_wallpaper_display()
