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

        # Detect data format and normalize
        self._normalize_data()

        # Configure matplotlib
        self._setup_plotting()

    def _normalize_data(self):
        """Detect and normalize different JSON formats"""
        # Check if this is a global_data.json (has 'scrims' array but no 'players')
        if 'scrims' in self.raw_data and 'players' not in self.raw_data:
            # This is a global data file - extract players from first scrim with player data
            for scrim_data in self.raw_data.get('scrims', []):
                if 'players' in scrim_data:
                    # Use the first scrim that has player data
                    self.raw_data = scrim_data
                    return
            # No scrim has player data, create empty players list
            self.raw_data['players'] = []

        # If 'players' key doesn't exist at all, create empty list
        if 'players' not in self.raw_data:
            self.raw_data['players'] = []

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
            # Calculate KDA: (Kills + Assists) / Deaths (avoid division by zero)
            totals = p.get("totals", {})
            kills = totals.get("kills", 0)
            deaths = totals.get("deaths", 0)
            assists = totals.get("assists", 0)
            kda = (kills + assists) / deaths if deaths > 0 else kills + assists

            base = {
                "name": p.get("summoner_name"),  # Changed from "name" to "summoner_name"
                "position": p.get("position"),
                "games_played": p.get("games"),  # Changed from "games_played" to "games"
                "wins": p.get("wins"),
                "losses": p.get("losses"),
                "winrate": p.get("winrate"),
                "kda": kda,  # Calculate KDA from totals
            }

            # Handle totals
            if "totals" in p:
                for stat_name, stat_value in p["totals"].items():
                    base[f"total_{stat_name}"] = stat_value

            # Handle averages - using the actual field names from JSON
            if "averages" in p:
                averages = p["averages"]
                base["avg_kills"] = averages.get("kills")
                base["avg_deaths"] = averages.get("deaths")
                base["avg_assists"] = averages.get("assists")
                base["avg_kill_participation"] = averages.get("kill_participation")
                base["per_min_damage"] = averages.get("damage_per_min")
                base["per_min_gold"] = averages.get("gold_per_min")
                base["per_min_cs"] = averages.get("cs_per_min")
                base["avg_vision"] = averages.get("vision_per_game")

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

        # Add champion stats back to each player (DataFrame conversion loses nested data)
        for i, player_dict in enumerate(players_data):
            original_player = players[i]
            # Add champions if it exists (renamed from "champion_stats")
            if "champions" in original_player:
                player_dict["champions"] = original_player["champions"]
                # Also add as top_champions for backwards compatibility
                champ_stats = original_player["champions"]
                sorted_champs = sorted(champ_stats, key=lambda x: x.get("games", 0), reverse=True)
                player_dict["top_champions"] = sorted_champs[:5]

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

        # Convert to lists to avoid dtype issues with matplotlib
        names = [str(x) for x in ordered["name"].tolist()]
        winrates = [float(x) if pd.notna(x) else 0.0 for x in ordered["winrate"].tolist()]

        plt.figure(figsize=(10, 6))
        plt.bar(range(len(names)), winrates, color='#4ECDC4')
        plt.xticks(range(len(names)), names, rotation=45, ha="right")
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

        # Convert to native Python types
        kda_values = [float(x) if pd.notna(x) else 0.0 for x in players_df["kda"].tolist()]
        dpm_values = [float(x) if pd.notna(x) else 0.0 for x in players_df["per_min_damage"].tolist()]
        names = [str(x) for x in players_df["name"].tolist()]

        plt.figure(figsize=(10, 6))
        plt.scatter(kda_values, dpm_values, s=100, alpha=0.6, color='#FF6B6B')

        for i, name in enumerate(names):
            plt.annotate(name, (kda_values[i], dpm_values[i]),
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

        # Helper function to calculate KDA
        def calc_kda(p):
            totals = p.get("totals", {})
            kills = totals.get("kills", 0)
            deaths = totals.get("deaths", 0)
            assists = totals.get("assists", 0)
            return (kills + assists) / deaths if deaths > 0 else kills + assists

        # Helper function to get metric value
        def get_metric(p, metric_key):
            if metric_key == "kda":
                return calc_kda(p)
            elif metric_key == "dpm":
                return p.get("averages", {}).get("damage_per_min", 0.0)
            elif metric_key == "gpm":
                return p.get("averages", {}).get("gold_per_min", 0.0)
            elif metric_key == "csm":
                return p.get("averages", {}).get("cs_per_min", 0.0)
            elif metric_key == "kp":
                return p.get("averages", {}).get("kill_participation", 0.0)
            return 0.0

        metrics = [
            ("kda", "KDA"),
            ("dpm", "DPM"),
            ("gpm", "GPM"),
            ("csm", "CSM"),
            ("kp", "KP"),
        ]

        labels = [lab for _, lab in metrics]
        raw_rows, names = [], []

        for p in players:
            names.append(p.get("summoner_name", ""))
            raw_rows.append([get_metric(p, key) for key, _ in metrics])

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
