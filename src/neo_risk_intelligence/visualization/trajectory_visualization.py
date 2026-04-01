import matplotlib.pyplot as plt

from src.neo_risk_intelligence.physics.trajectory_engine import get_trajectory

def plot_trajectory(object_id):
    df = get_trajectory(object_id, "2026-01-01", "2026-01-10")

    if df.empty:
        print("No trajectory data")
        return

    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    ax.plot(df["x"], df["y"], df["z"])

    ax.scatter(0, 0, 0, s=300)

    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    ax.set_zlabel("Z")

    return fig

if __name__ == "__main__":
    fig = plot_trajectory("433")
    if fig:
        import matplotlib.pyplot as plt
        plt.show()
