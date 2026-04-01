import matplotlib.pyplot as plt

from src.neo_risk_intelligence.visualization.earth_frame import load_close_approaches, to_earth_centered

def plot_earth_frame():
    df = load_close_approaches()
    df = to_earth_centered(df)

    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    ax.scatter(0, 0, 0, s=300)
    ax.scatter(df["x"], df["y"], df["z"], s=20)

    close_df = df[df["miss_distance_km"] < 1_000_000]
    ax.scatter(close_df["x"], close_df["y"], close_df["z"], s=60)

    max_range = df["miss_distance_km"].max()

    ax.set_xlim(-max_range, max_range)
    ax.set_ylim(-max_range, max_range)
    ax.set_zlim(-max_range, max_range)

    ax.set_xlabel("X (km)")
    ax.set_ylabel("Y (km)")
    ax.set_zlabel("Z (km)")

    return fig
