"""
Analytics module - Adapts the Python script to work as an API service
"""
import json
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend for server
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import Dict, List, Any
import math
from io import BytesIO
from PIL import Image

class ScrimAnalytics:
    """Process and analyze League of Legends scrim data"""

    def __init__(self, data_file: Path):
        self.data_file = Path(data_file)
        self.export_dir = Path(__file__).parent.parent / "exports"
        self.charts_dir = self.export_dir / "charts"
        self.charts_dir.mkdir(parents=True, exist_ok=True)

        # Load data
        with open(self.data_file, 'r', encoding='utf-8') as f:
            self.raw_data = json.load(f)

        # Configure matplotlib
        self._setup_plotting()

    def _setup_plotting(self):
        """Configure matplotlib style"""
        plt.style.use('default')
        plt.rcParams['font.family'] = 'sans-serif'
        plt.rcParams['font.size'] = 11
        plt.rcParams['figure.facecolor'] = 'white'
        plt.rcParams['axes.facecolor'] = 'white'
        plt.rcParams['axes.grid'] = True
        plt.rcParams['grid.alpha'] = 0.3

    def _expand_players(self, players: List[Dict]) -> pd.DataFrame:
        """Convert players data to DataFrame"""
        rows = []
        for p in players:
            base = {
                "name": p.get("name"),
                "position": p.get("position"),
                "games_played": p.get("games_played"),
                "wins": p.get("wins"),
                "losses": p.get("losses"),
                "winrate": p.get("winrate"),
                "kda": p.get("kda"),
            }

            stat_types = {
                "totals": "total",
                "averages": "avg",
                "per_minute": "per_min"
            }

            for source_key, prefix in stat_types.items():
                for stat_name, stat_value in (p.get(source_key) or {}).items():
                    base[f"{prefix}_{stat_name}"] = stat_value

            rows.append(base)

        return pd.DataFrame(rows)

    def _to_numeric_safe(self, df: pd.DataFrame, cols: List[str]):
        """Convert columns to numeric safely"""
        for c in cols:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors="coerce")

    def get_players_overview(self) -> Dict[str, Any]:
        """Get overview statistics for all players"""
        players = self.raw_data.get("players", [])
        players_df = self._expand_players(players)

        # Convert to numeric
        numeric_cols = [
            "games_played", "wins", "losses", "winrate", "kda",
            "total_kills", "total_deaths", "total_assists",
            "avg_kill_participation", "per_min_damage", "per_min_gold", "per_min_cs"
        ]
        self._to_numeric_safe(players_df, numeric_cols)

        # Convert DataFrame to dict for JSON serialization
        players_data = players_df.to_dict(orient='records')

        return {
            "players": players_data,
            "total_players": len(players_data),
            "team_stats": {
                "avg_winrate": float(players_df["winrate"].mean()) if "winrate" in players_df else 0,
                "avg_kda": float(players_df["kda"].mean()) if "kda" in players_df else 0,
                "total_games": int(players_df["games_played"].sum()) if "games_played" in players_df else 0
            }
        }

    def generate_winrate_chart(self) -> str:
        """Generate winrate bar chart"""
        players = self.raw_data.get("players", [])
        players_df = self._expand_players(players)
        self._to_numeric_safe(players_df, ["winrate"])

        ordered = players_df[["name", "winrate"]].sort_values("winrate", ascending=False)

        plt.figure(figsize=(10, 6))
        plt.bar(ordered["name"], ordered["winrate"], color='#4ECDC4')
        plt.xticks(rotation=45, ha="right")
        plt.ylabel("Winrate (%)")
        plt.title("Winrate par joueur")
        plt.tight_layout()

        chart_path = self.charts_dir / "winrate_by_player.png"
        plt.savefig(chart_path, dpi=200, bbox_inches="tight")
        plt.close()

        return str(chart_path)

    def generate_kda_chart(self) -> str:
        """Generate KDA comparison chart"""
        players = self.raw_data.get("players", [])
        players_df = self._expand_players(players)
        self._to_numeric_safe(players_df, ["kda", "per_min_damage"])

        plt.figure(figsize=(10, 6))
        plt.scatter(players_df["kda"], players_df["per_min_damage"], s=100, alpha=0.6, color='#FF6B6B')

        for _, r in players_df.iterrows():
            plt.annotate(r["name"], (r["kda"], r["per_min_damage"]),
                        xytext=(5, 5), textcoords='offset points', fontsize=9)

        plt.xlabel("KDA")
        plt.ylabel("Dégâts par minute (DPM)")
        plt.title("KDA vs DPM par joueur")
        plt.grid(alpha=0.3)
        plt.tight_layout()

        chart_path = self.charts_dir / "kda_vs_dpm.png"
        plt.savefig(chart_path, dpi=200, bbox_inches="tight")
        plt.close()

        return str(chart_path)

    def generate_radar_players(self) -> str:
        """Generate radar chart mosaic for all players"""
        players = self.raw_data.get("players", [])

        metrics = [
            ("kda", "KDA"),
            ("per_minute.damage", "DPM"),
            ("per_minute.gold", "GPM"),
            ("per_minute.cs", "CSM"),
            ("averages.kill_participation", "KP"),
        ]

        def get_nested(d, dotted, default=0.0):
            cur = d
            for k in dotted.split("."):
                if not isinstance(cur, dict) or k not in cur:
                    return default
                cur = cur[k]
            try:
                return float(cur)
            except Exception:
                return default

        labels = [lab for _, lab in metrics]
        raw_rows, names = [], []

        for p in players:
            names.append(p.get("name", ""))
            raw_rows.append([get_nested(p, key, 0.0) for key, _ in metrics])

        raw_mat = np.array(raw_rows, dtype=float)
        mins = raw_mat.min(axis=0)
        maxs = raw_mat.max(axis=0)
        rng = np.where(maxs - mins == 0, 1.0, maxs - mins)
        norm = (raw_mat - mins) / rng
        team_avg = norm.mean(axis=0)

        # Create figure with subplots
        n_players = len(names)
        cols = min(3, n_players)
        rows = math.ceil(n_players / cols)

        fig = plt.figure(figsize=(cols * 5, rows * 5))

        for idx, (name, vals) in enumerate(zip(names, norm)):
            ax = fig.add_subplot(rows, cols, idx + 1, projection='polar')

            # Prepare data
            angles = np.linspace(0, 2 * math.pi, len(labels), endpoint=False)
            vals_plot = np.concatenate([vals, vals[:1]])
            team_plot = np.concatenate([team_avg, team_avg[:1]])
            angles_plot = np.concatenate([angles, angles[:1]])

            # Plot
            ax.plot(angles_plot, team_plot, 'o--', linewidth=1, color='gray', alpha=0.5, label='Team Avg')
            ax.plot(angles_plot, vals_plot, 'o-', linewidth=2, label=name)
            ax.fill(angles_plot, vals_plot, alpha=0.25)

            # Styling
            ax.set_xticks(angles)
            ax.set_xticklabels(labels, size=9)
            ax.set_ylim(0, 1)
            ax.set_yticks([0.25, 0.5, 0.75])
            ax.set_yticklabels(['', '', ''], size=8)
            ax.grid(True, alpha=0.3)
            ax.set_title(name, size=12, fontweight='bold', pad=20)

        plt.tight_layout()

        chart_path = self.charts_dir / "radar_players.png"
        plt.savefig(chart_path, dpi=200, bbox_inches="tight", facecolor='white')
        plt.close()

        return str(chart_path)

    def process(self) -> Dict[str, Any]:
        """Process all analytics and return results"""
        try:
            # Generate charts
            winrate_chart = self.generate_winrate_chart()
            kda_chart = self.generate_kda_chart()
            radar_chart = self.generate_radar_players()

            # Get player stats
            players_stats = self.get_players_overview()

            return {
                "success": True,
                "data": players_stats,
                "charts": {
                    "winrate": winrate_chart.replace(str(self.export_dir), "/exports"),
                    "kda": kda_chart.replace(str(self.export_dir), "/exports"),
                    "radar": radar_chart.replace(str(self.export_dir), "/exports")
                },
                "timestamp": pd.Timestamp.now().isoformat()
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
